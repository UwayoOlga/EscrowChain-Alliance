import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';
import {
    ESCROW_BLUEPRINT, REDEEMER, ARBITRATOR_WALLET,
    getEscrowAddress, buildDatum, getDatumHash,
    awaitTxConfirmation, assertNetwork,
} from '../utils/escrow';
import { deserializeAddress, BlockfrostProvider } from '@meshsdk/core';

export default function Payments() {
    const { user } = useAuth();
    const { connected, wallet } = useWallet();
    const [transactions, setTransactions] = useState([]);
    const [activeLeases, setActiveLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const loadData = () => {
        setLoading(true);
        Promise.all([api.getTransactions(), api.getLeases()])
            .then(([tData, lData]) => {
                setTransactions(Array.isArray(tData) ? tData : []);

                // Only tenants need to see the "Pay Rent" block
                if (user?.role?.toLowerCase() !== 'landlord') {
                    setActiveLeases((Array.isArray(lData) ? lData : []).filter(l => l.status === 'active' && l.tenant_id === user.id));
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handlePayRent = async (lease) => {
        if (!connected) {
            alert('Please connect your Cardano wallet in the topbar to authorize this on-chain ledger transfer.');
            return;
        }

        setProcessing(true);
        try {
            await assertNetwork(wallet);

            if (!lease.landlord_wallet || !lease.tenant_wallet) {
                throw new Error('Both parties must connect their Cardano wallets before making payments.');
            }

            // Resolve PKHs to build the datum matching what was locked at contract signing
            const landlordPkh   = deserializeAddress(lease.landlord_wallet).pubKeyHash;
            const tenantPkh     = deserializeAddress(lease.tenant_wallet).pubKeyHash;

            const apiKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
            if (!apiKey) throw new Error('VITE_BLOCKFROST_PROJECT_ID is required to locate the escrow UTXO.');

            // Find the specific UTXO locked for this lease
            const arbitratorPkh  = deserializeAddress(ARBITRATOR_WALLET).pubKeyHash;
            const expectedHash   = getDatumHash(lease, landlordPkh, tenantPkh, arbitratorPkh);
            const escrowAddress  = getEscrowAddress();

            const provider = new BlockfrostProvider(apiKey);
            const utxos    = await provider.fetchAddressUtxos(escrowAddress);
            const targetUtxo = utxos.find(u => u.output.dataHash === expectedHash);

            if (!targetUtxo) throw new Error('Escrow UTXO not found. The contract may not have been signed yet.');

            // Spend the UTXO using CollectRent redeemer — landlord receives rent_amount
            const rentLovelace = (Number(lease.rent_amount) * 1_000_000).toString();

            const tx = new Transaction({ initiator: wallet });
            tx.redeemValue({
                value: targetUtxo,
                script: ESCROW_BLUEPRINT,
                datum: targetUtxo.output.plutusData,
                redeemer: { data: REDEEMER.CollectRent },
            });
            tx.sendLovelace(lease.landlord_wallet, rentLovelace);

            const unsignedTx = await tx.build();
            const signedTx   = await wallet.signTx(unsignedTx);
            const txHash     = await wallet.submitTx(signedTx);

            console.log('CollectRent tx submitted:', txHash);

            // Record as pending first so UI updates immediately
            const escrowRecord = await api.createEscrow({
                leaseId: lease.id,
                action: 'CollectRent',
                amount: Number(lease.rent_amount),
                txHash,
            });
            loadData();

            // Wait for block confirmation then finalize
            await awaitTxConfirmation(txHash);
            await api.updateEscrow(escrowRecord.id, { status: 'released' });
            loadData();

        } catch (err) {
            console.error('Rent execution encountered an error:', err);
            alert('Payment execution failed: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="page container"><p>Loading Financial Ledger & Mesh SDK context...</p></div>;

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    const totalVolume = transactions
        .filter(t => t.action === 'CollectRent' && t.status === 'confirmed')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingEscrow = transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="page container fade-in" style={{ maxWidth: '1000px' }}>
            <div className="page-header text-center" style={{ marginBottom: '64px' }}>
                <span className="text-overline">Financial Governance</span>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Asset Transaction Ledger</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
                    {isLandlord
                        ? 'Track automated escrow distributions and rental income across your property portfolio.'
                        : 'Submit your rental obligations via smart contract and review historical payment logs.'}
                </p>
            </div>

            <div className="grid grid-3" style={{ marginBottom: '48px' }}>
                <div className="card metric-card" style={{ borderTop: '4px solid var(--success)' }}>
                    <span className="metric-label">{isLandlord ? 'Total Realized Yield' : 'Total Cumulative Payments'}</span>
                    <div className="metric-value">RWF {totalVolume.toLocaleString()}</div>
                    <div className="metric-sub">Verified On-Chain Transfers</div>
                </div>
                <div className="card metric-card" style={{ borderTop: '4px solid var(--warning)' }}>
                    <span className="metric-label">{isLandlord ? 'Funds in Transit' : 'In Escrow (Pre-Lock)'}</span>
                    <div className="metric-value">RWF {pendingEscrow.toLocaleString()}</div>
                    <div className="metric-sub">Held within Smart Contract</div>
                </div>
                <div className="card metric-card" style={{ borderTop: '4px solid var(--dark-slate)' }}>
                    <span className="metric-label">Total Smart Events</span>
                    <div className="metric-value">{transactions.length}</div>
                    <div className="metric-sub">Local Escrow Reference</div>
                </div>
            </div>

            {/* TENANT RENT PAYMENT PORTAL */}
            {!isLandlord && activeLeases.length > 0 && (
                <div style={{ marginBottom: '48px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>Upcoming Rent Remittances</h2>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {activeLeases.map(lease => (
                            <div key={lease.id} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--accent)' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Active Contract</div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>CT-{lease.id.substring(0, 8).toUpperCase()}</div>
                                </div>
                                <div style={{ flex: 1, marginBottom: '32px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Standard Rental Due</div>
                                    <div style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--dark-slate)' }}>RWF {lease.rent_amount}</div>
                                </div>
                                <button
                                    className="btn btn-dark btn-square"
                                    style={{ width: '100%', padding: '16px' }}
                                    disabled={processing}
                                    onClick={() => handlePayRent(lease)}
                                >
                                    {processing ? 'Signing Transaction...' : 'Pay Current Rent'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FULL TRANSACTION LEDGER */}
            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>Transaction History</h2>
            {transactions.length === 0 ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center', border: '1px dashed var(--border)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No financial ledger events recorded for this address yet.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrap">
                        <table style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Event Date</th>
                                    <th>Asset Source</th>
                                    <th>Action Type</th>
                                    <th>Amount (RWF)</th>
                                    <th>Network Status</th>
                                    <th>Audit Trace</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{t.property_address || 'Property Deleted'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lease Ref: {t.lease_id?.substring(0, 8).toUpperCase()}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 500 }}>{t.action}</span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: t.action === 'CollectRent' ? 'var(--success)' : 'var(--text-primary)' }}>
                                            {t.action === 'CollectRent' ? '+' : ''}RWF {t.amount}
                                        </td>
                                        <td>
                                            <span className={`badge ${t.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            {t.tx_hash ? (
                                                <a href={`https://preprod.cardanoscan.io/transaction/${t.tx_hash}`} target="_blank" rel="noreferrer" className="link-arrow dark" style={{ fontSize: '0.8rem' }}>
                                                    Explorer &rarr;
                                                </a>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local Cache</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
