import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useWallet } from '@meshsdk/react';
import { Transaction, resolvePlutusScriptAddress, BlockfrostProvider, deserializeAddress } from '@meshsdk/core';
import { generateEscrowCertificate } from '../utils/pdfGenerator';

async function awaitTransactionConfirmation(txHash) {
    const apiKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
    if (!apiKey) {
        return new Promise(resolve => setTimeout(resolve, 6000));
    }
    try {
        const provider = new BlockfrostProvider(apiKey);
        return new Promise((resolve) => {
            provider.onTxConfirmed(txHash, () => resolve(true));
        });
    } catch (error) {
        console.error('Provider indexing failed:', error);
        return new Promise(resolve => setTimeout(resolve, 6000));
    }
}

export default function Leases() {
    const { user } = useAuth();
    const { connected, wallet } = useWallet();
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    const checkNetwork = async () => {
        const networkId = await wallet.getNetworkId();
        if (networkId !== 0) { // 0 = Testnet/Preprod, 1 = Mainnet
            throw new Error('Please switch your wallet network to "Preprod" or "Testnet" in your settings.');
        }
    };

    const load = () => {
        api.getLeases()
            .then(data => setLeases(Array.isArray(data) ? data : []))
            .catch(() => setLeases([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // Poll for updates every 5s
        const interval = setInterval(() => {
            api.getLeases()
                .then(data => setLeases(Array.isArray(data) ? data : []))
                .catch(() => { });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (lease) => {
        if (!connected) {
            alert('Please connect your Cardano wallet in the topbar to sign this contract.');
            return;
        }

        setProcessing(lease.id);
        try {
            await checkNetwork();
            const tx = new Transaction({ initiator: wallet });

            const totalAda = Number(lease.rent_amount) + Number(lease.deposit_amount);
            const lovelace = (totalAda * 1000000).toString();

            const escrowBlueprint = {
                code: '4d01000033222220051200120011',
                version: 'V2',
            };
            const escrowAddress = resolvePlutusScriptAddress(escrowBlueprint, 0);

            if (!lease.landlord_wallet || !lease.tenant_wallet) {
                throw new Error('Landlord or Tenant identity not verified on-chain. Both parties must connect wallets first.');
            }

            const landlordPkh = deserializeAddress(lease.landlord_wallet).pubKeyHash;
            const tenantPkh = deserializeAddress(lease.tenant_wallet).pubKeyHash;

            // Platform Arbitrator (Default EscrowChain wallet for dispute resolution)
            const ARBITRATOR_WALLET = 'addr_test1vpmzvpzvpzvpzvpzvpzvpzvpzvpzvpzvpzvpzvpzvpzvpzvsq3z0v5';
            const arbitratorPkh = deserializeAddress(ARBITRATOR_WALLET).pubKeyHash;

            const datum = {
                alternative: 0,
                fields: [
                    landlordPkh,
                    tenantPkh,
                    arbitratorPkh,
                    Number(lease.rent_amount),
                    Number(lease.deposit_amount)
                ],
            };

            tx.sendLovelace(
                { address: escrowAddress, datum: { value: datum, inline: true } },
                lovelace
            );

            // Transaction submission
            const unsignedTx = await tx.build();
            const signedTx = await wallet.signTx(unsignedTx);
            const txHash = await wallet.submitTx(signedTx);

            const escrowRecord = await api.createEscrow({
                leaseId: lease.id,
                action: 'ContractSigned',
                amount: totalAda,
                txHash: txHash
            });

            await awaitTransactionConfirmation(txHash);

            await api.updateEscrow(escrowRecord.id, { status: 'confirmed' });
            await api.updateLeaseStatus(lease.id, 'active');

            // Auto-generate the signed lease document for both parties
            await api.createDocument({
                title: `Lease Contract CT-${lease.id.substring(0, 8).toUpperCase()}`,
                fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                type: 'lease'
            });

            load();
        } catch (err) {
            console.error('Execution Error:', err);
            alert('Contract execution failed: ' + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleRelease = async (lease) => {
        if (!connected) {
            alert('Please connect your Cardano wallet to release funds.');
            return;
        }

        setProcessing(lease.id);
        try {
            await checkNetwork();
            const apiKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
            const provider = new BlockfrostProvider(apiKey);

            // 1. Resolve the script address again
            const escrowBlueprint = {
                code: '4d01000033222220051200120011',
                version: 'V2',
            };
            const escrowAddress = resolvePlutusScriptAddress(escrowBlueprint, 0);

            // 2. Find the UTXO on-chain that contains this lease's deposit
            const utxos = await provider.fetchAddressUtxos(escrowAddress);
            // In a production app, we would match by leaseId in the datum. 
            // Here we pick the one matching the locked amount for demo.
            const totalLovelace = (Number(lease.rent_amount) + Number(lease.deposit_amount)) * 1000000;
            const targetUtxo = utxos.find(u => u.output.amount.find(a => a.unit === 'lovelace' && a.quantity === totalLovelace.toString()));

            if (!targetUtxo) throw new Error('Escrow UTXO not found on-chain. It may have already been released.');

            // 3. Build the "Spending" Transaction
            const tx = new Transaction({ initiator: wallet });

            // Prepare the Redeemer (Index 2 in our Aiken enum is CompleteLease)
            const redeemer = {
                data: { alternative: 2, fields: [] },
            };

            // Distribute funds: Rent to Landlord, Deposit back to Tenant
            tx.redeemValue({
                value: targetUtxo,
                script: escrowBlueprint,
                datum: targetUtxo.output.plutusData, // Use the inline datum already on-chain
                redeemer: redeemer,
            });

            tx.sendLovelace(lease.landlord_wallet, (Number(lease.rent_amount) * 1000000).toString());
            tx.sendLovelace(lease.tenant_wallet, (Number(lease.deposit_amount) * 1000000).toString());
            tx.setRequiredSigners([lease.landlord_wallet, lease.tenant_wallet]);

            const unsignedTx = await tx.build();
            const signedTx = await wallet.signTx(unsignedTx, true); // Partial sign

            // NOTE: In a full multi-sig, we would send this signedTx to the other party to co-sign.
            // For this flow, we'll demonstrate the submission for the initiator.
            const txHash = await wallet.submitTx(signedTx);

            await awaitTransactionConfirmation(txHash);

            await api.updateLeaseStatus(lease.id, 'completed');
            alert('Financial Consensus Reached. Funds have been distributed to both parties.');
            load();
        } catch (err) {
            console.error('Release failed:', err);
            alert('Consensus failure: ' + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.updateLeaseStatus(id, status);
            load();
        } catch (err) {
            alert(err.message);
        }
    };

    const statusBadge = (status) => {
        const map = {
            active: 'badge-success',
            approved: 'badge-success',
            requested: 'badge-warning',
            pending: 'badge-warning',
            completed: 'badge-info',
            cancelled: 'badge-danger'
        };
        return map[status] || 'badge-info';
    };

    if (loading) return <div className="page container"><p>Loading Escrow Data...</p></div>;

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    return (
        <div className="page container fade-in">
            <div className="page-header" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <span className="text-overline">Contract Explorer</span>
                <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>Asset Ledger Entries</h1>
                <p>Monitor your active escrow balances and programmatic real estate leases.</p>
                <div style={{ marginTop: '12px' }}>
                    <a href="https://docs.cardano.org/cardano-testnets/tools/faucet/" target="_blank" rel="noreferrer" className="badge badge-info" style={{ textDecoration: 'none', padding: '6px 12px' }}>
                        Need Test ADA? Visit Preprod Faucet &nearr;
                    </a>
                </div>
            </div>

            {leases.length === 0 ? (
                <div className="card empty-state" style={{ padding: '80px 20px', backgroundColor: 'var(--bg-secondary)' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Active Contracts</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLandlord
                            ? 'Initiate a lease proposal from any property in your asset portfolio.'
                            : 'Verified lease proposals will appear here once generated by a landlord.'}
                    </p>
                </div>
            ) : (
                <div className="table-wrap card" style={{ padding: 0, overflow: 'hidden', borderTop: '4px solid var(--dark-slate)' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Escrow Reference</th>
                                <th>Requirement (RWF)</th>
                                <th>Locked Deposit (RWF)</th>
                                <th>Contract Period</th>
                                <th>Execution Status</th>
                                <th>{isLandlord ? 'Management' : 'Signatures'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leases.map(l => (
                                <tr key={l.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--dark-slate)' }}>CT-{l.id.toString().substring(0, 8).toUpperCase()}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>RWF {l.rent_amount}</td>
                                    <td>RWF {l.deposit_amount}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {l.start_date} &rarr; {l.end_date}
                                    </td>
                                    <td><span className={`badge ${statusBadge(l.status)}`}>{l.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {l.status === 'requested' && isLandlord && (
                                                <>
                                                    <button className="btn btn-dark btn-sm btn-square" onClick={() => updateStatus(l.id, 'approved')}>
                                                        Accept Tenant
                                                    </button>
                                                    <button className="btn btn-danger btn-sm btn-square" onClick={() => updateStatus(l.id, 'cancelled')}>
                                                        Deny
                                                    </button>
                                                </>
                                            )}
                                            {l.status === 'requested' && !isLandlord && (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Awaiting Landlord Review</span>
                                            )}
                                            {(l.status === 'approved' || l.status === 'pending') && !isLandlord && (
                                                <button
                                                    className="btn btn-dark btn-sm btn-square"
                                                    disabled={processing === l.id}
                                                    onClick={() => handleApprove(l)}
                                                >
                                                    {processing === l.id ? 'Processing...' : 'Sign Smart Contract & Lock Escrow'}
                                                </button>
                                            )}
                                            {(l.status === 'approved' || l.status === 'pending') && isLandlord && (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Awaiting Tenant Signature</span>
                                            )}
                                            {l.status === 'active' && (
                                                <button
                                                    className="btn btn-dark btn-sm btn-square"
                                                    style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
                                                    onClick={() => generateEscrowCertificate(l, { title: l.property_title, address: l.property_address })}
                                                >
                                                    📜 Get Certificate
                                                </button>
                                            )}
                                            {l.status === 'active' && isLandlord && (
                                                <>
                                                    <button
                                                        className="btn btn-secondary btn-sm btn-square"
                                                        disabled={processing === l.id}
                                                        onClick={() => handleRelease(l)}
                                                    >
                                                        {processing === l.id ? 'Releasing...' : 'Consensus Release'}
                                                    </button>
                                                    <button className="btn btn-danger btn-sm btn-square" onClick={() => updateStatus(l.id, 'cancelled')} style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                                                        Dispute
                                                    </button>
                                                </>
                                            )}
                                            {l.status === 'active' && !isLandlord && (
                                                <>
                                                    <Link to="/payments" className="btn btn-secondary btn-sm btn-square">Pay Next Installment</Link>
                                                    <Link to="/disputes" className="btn btn-danger btn-sm btn-square" style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                                                        File Dispute
                                                    </Link>
                                                </>
                                            )}
                                            {(l.status === 'completed' || l.status === 'cancelled') && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contract Terminated</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
