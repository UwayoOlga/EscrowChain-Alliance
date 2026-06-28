import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useWallet } from '@meshsdk/react';
import { Transaction, deserializeAddress, BlockfrostProvider } from '@meshsdk/core';
import { generateEscrowCertificate } from '../utils/pdfGenerator';
import {
    ESCROW_BLUEPRINT, ARBITRATOR_WALLET, REDEEMER,
    getEscrowAddress, buildDatum, getDatumHash,
    awaitTxConfirmation, assertNetwork,
} from '../utils/escrow';

export default function Leases() {
    const { user } = useAuth();
    const { connected, wallet } = useWallet();
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);



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
            await assertNetwork(wallet);

            if (!lease.landlord_wallet || !lease.tenant_wallet) {
                throw new Error('Both parties must connect their Cardano wallets first.');
            }

            const landlordPkh    = deserializeAddress(lease.landlord_wallet).pubKeyHash;
            const tenantPkh      = deserializeAddress(lease.tenant_wallet).pubKeyHash;
            const arbitratorPkh  = deserializeAddress(ARBITRATOR_WALLET).pubKeyHash;

            const datum          = buildDatum(lease, landlordPkh, tenantPkh, arbitratorPkh);
            const escrowAddress  = getEscrowAddress();

            // Lock rent + deposit into the script as a single UTXO with inline datum
            const totalLovelace = (
                (Number(lease.rent_amount) + Number(lease.deposit_amount)) * 1_000_000
            ).toString();

            const tx = new Transaction({ initiator: wallet });
            tx.sendLovelace(
                { address: escrowAddress, datum: { value: datum, inline: true } },
                totalLovelace
            );

            const unsignedTx = await tx.build();
            const signedTx   = await wallet.signTx(unsignedTx);
            const txHash     = await wallet.submitTx(signedTx);

            // Record escrow as pending while we wait for block confirmation
            const escrowRecord = await api.createEscrow({
                leaseId: lease.id,
                action: 'ContractSigned',
                amount: Number(lease.rent_amount) + Number(lease.deposit_amount),
                txHash,
            });

            await awaitTxConfirmation(txHash);

            // Finalize: mark locked on-chain, activate lease
            await api.updateEscrow(escrowRecord.id, { status: 'locked' });
            await api.updateLeaseStatus(lease.id, 'active');

            await api.createDocument({
                title: `Lease Contract CT-${lease.id.substring(0, 8).toUpperCase()}`,
                fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                type: 'lease',
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
            await assertNetwork(wallet);

            const apiKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
            if (!apiKey) throw new Error('VITE_BLOCKFROST_PROJECT_ID is required to locate the on-chain UTXO.');

            const provider      = new BlockfrostProvider(apiKey);
            const escrowAddress = getEscrowAddress();

            // Find the exact UTXO for this lease by matching the datum hash
            const utxos          = await provider.fetchAddressUtxos(escrowAddress);
            const landlordPkh    = deserializeAddress(lease.landlord_wallet).pubKeyHash;
            const tenantPkh      = deserializeAddress(lease.tenant_wallet).pubKeyHash;
            const arbitratorPkh  = deserializeAddress(ARBITRATOR_WALLET).pubKeyHash;
            const expectedHash   = getDatumHash(lease, landlordPkh, tenantPkh, arbitratorPkh);
            const targetUtxo     = utxos.find(u => u.output.dataHash === expectedHash);

            if (!targetUtxo) throw new Error('Escrow UTXO not found on-chain. It may already have been released.');

            // Build CompleteLease spending tx — landlord signs first (partial multisig)
            const tx = new Transaction({ initiator: wallet });
            tx.redeemValue({
                value: targetUtxo,
                script: ESCROW_BLUEPRINT,
                datum: targetUtxo.output.plutusData,
                redeemer: { data: REDEEMER.CompleteLease },
            });
            tx.sendLovelace(
                lease.landlord_wallet,
                (Number(lease.rent_amount) * 1_000_000).toString()
            );
            tx.sendLovelace(
                lease.tenant_wallet,
                (Number(lease.deposit_amount) * 1_000_000).toString()
            );
            tx.setRequiredSigners([lease.landlord_wallet, lease.tenant_wallet]);

            const unsignedTx = await tx.build();
            const signedTx   = await wallet.signTx(unsignedTx, true); // partial sign

            // Store partially-signed tx so tenant can co-sign
            await api.createEscrow({
                leaseId: lease.id,
                amount: Number(lease.rent_amount) + Number(lease.deposit_amount),
                action: 'CompleteLease',
                metadata: { partiallySignedTx: signedTx },
            });

            await api.updateLeaseStatus(lease.id, 'release_requested');
            alert('Step 1 Complete: Landlord signature secured. Awaiting Tenant co-signature.');
            load();
        } catch (err) {
            console.error('Release failed:', err);
            alert('Consensus failure: ' + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleDisputeOnChain = async (lease) => {
        if (!connected) {
            alert('Please connect your Cardano wallet to raise a dispute.');
            return;
        }
        setProcessing(lease.id + '-dispute');
        try {
            await assertNetwork(wallet);

            const apiKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
            if (!apiKey) throw new Error('VITE_BLOCKFROST_PROJECT_ID is required.');

            const provider      = new BlockfrostProvider(apiKey);
            const escrowAddress = getEscrowAddress();

            const utxos          = await provider.fetchAddressUtxos(escrowAddress);
            const landlordPkh    = deserializeAddress(lease.landlord_wallet).pubKeyHash;
            const tenantPkh      = deserializeAddress(lease.tenant_wallet).pubKeyHash;
            const arbitratorPkh  = deserializeAddress(ARBITRATOR_WALLET).pubKeyHash;
            const expectedHash   = getDatumHash(lease, landlordPkh, tenantPkh, arbitratorPkh);
            const targetUtxo     = utxos.find(u => u.output.dataHash === expectedHash);

            if (!targetUtxo) throw new Error('Escrow UTXO not found on-chain.');

            // Route ALL funds to arbitrator using Dispute redeemer
            const totalLovelace = (
                (Number(lease.rent_amount) + Number(lease.deposit_amount)) * 1_000_000
            ).toString();

            const tx = new Transaction({ initiator: wallet });
            tx.redeemValue({
                value: targetUtxo,
                script: ESCROW_BLUEPRINT,
                datum: targetUtxo.output.plutusData,
                redeemer: { data: REDEEMER.Dispute },
            });
            tx.sendLovelace(ARBITRATOR_WALLET, totalLovelace);

            const unsignedTx = await tx.build();
            const signedTx   = await wallet.signTx(unsignedTx);
            const txHash     = await wallet.submitTx(signedTx);

            await awaitTxConfirmation(txHash);

            // Record dispute tx and freeze lease in DB
            await api.createEscrow({
                leaseId: lease.id,
                action: 'Dispute',
                amount: Number(lease.rent_amount) + Number(lease.deposit_amount),
                txHash,
                metadata: { disputedBy: user.id },
            });

            alert('Dispute submitted on-chain. Funds are now held by the arbitrator.');
            load();
        } catch (err) {
            console.error('Dispute failed:', err);
            alert('Dispute transaction failed: ' + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleCoSignRelease = async (lease) => {
        setProcessing(lease.id);
        try {
            // Recover the partially-signed tx stored by the landlord
            const txns     = await api.getEscrowByLease(lease.id);
            const pendingTx = txns.find(t => t.action === 'CompleteLease' && t.status === 'pending');
            if (!pendingTx) throw new Error('No pending release found. Ask the landlord to initiate first.');

            let meta = pendingTx.metadata;
            try { meta = typeof meta === 'string' ? JSON.parse(meta) : meta; } catch { /**/ }
            if (!meta?.partiallySignedTx) throw new Error('Landlord signature missing from stored tx.');

            // Tenant adds their signature and submits
            const fullySignedTx = await wallet.signTx(meta.partiallySignedTx, true);
            const txHash        = await wallet.submitTx(fullySignedTx);

            await awaitTxConfirmation(txHash);

            // Mark released and close lease
            await api.updateEscrow(pendingTx.id, { status: 'released', txHash });
            await api.updateLeaseStatus(lease.id, 'completed');

            alert('Funds distributed on-chain! Both signatures confirmed.');
            load();
        } catch (err) {
            console.error('Co-Sign failed:', err);
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
            release_requested: 'badge-warning',
            'under dispute': 'badge-danger',
            completed: 'badge-info',
            cancelled: 'badge-danger',
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
                                                        disabled={!!processing}
                                                        onClick={() => handleRelease(l)}
                                                    >
                                                        {processing === l.id ? 'Releasing...' : 'Consensus Release'}
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm btn-square"
                                                        style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                                                        disabled={!!processing}
                                                        onClick={() => handleDisputeOnChain(l)}
                                                    >
                                                        {processing === l.id + '-dispute' ? 'Submitting...' : 'Dispute'}
                                                    </button>
                                                </>
                                            )}
                                            {l.status === 'active' && !isLandlord && (
                                                <>
                                                    <Link to="/payments" className="btn btn-secondary btn-sm btn-square">Pay Next Installment</Link>
                                                    <button
                                                        className="btn btn-danger btn-sm btn-square"
                                                        style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                                                        disabled={!!processing}
                                                        onClick={() => handleDisputeOnChain(l)}
                                                    >
                                                        {processing === l.id + '-dispute' ? 'Submitting...' : 'File Dispute'}
                                                    </button>
                                                </>
                                            )}
                                            {l.status === 'release_requested' && !isLandlord && (
                                                <button
                                                    className="btn btn-dark btn-sm btn-square"
                                                    disabled={processing === l.id}
                                                    onClick={() => handleCoSignRelease(l)}
                                                >
                                                    {processing === l.id ? 'Securing Consensus...' : 'Co-Sign & Release Funds'}
                                                </button>
                                            )}
                                            {l.status === 'release_requested' && isLandlord && (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Awaiting Tenant Signature</span>
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
