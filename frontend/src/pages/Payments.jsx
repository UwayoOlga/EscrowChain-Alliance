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

    if (loading) return <div className="page container"><p>Syncing financial ledgers...</p></div>;

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    const totalVolume = transactions
        .filter(t => t.action === 'CollectRent' && t.status === 'confirmed')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingEscrow = transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="page container fade-in" style={{ maxWidth: '1000px', padding: '16px 24px' }}>
            {/* Header Intro */}
            <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <span className="text-overline">Payments</span>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--dark-slate)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    Rent Payments & Ledger
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {isLandlord
                        ? 'Track rent payments, active deposits, and escrow logs across your property portfolio.'
                        : 'Submit lease payments to smart contract escrows and review your historical ledger.'}
                </p>
            </div>

            {/* DeFi metrics section */}
            <div className="grid grid-3" style={{ marginBottom: '48px' }}>
                <div className="metric-card metric-card--success">
                    <span className="metric-label">
                        {isLandlord ? 'Total Revenue' : 'Total Paid'}
                    </span>
                    <div className="metric-value">RWF {totalVolume.toLocaleString()}</div>
                    <div className="metric-sub">Verified on-chain transfers</div>
                </div>
                <div className="metric-card metric-card--warning">
                    <span className="metric-label">
                        Funds in Escrow
                    </span>
                    <div className="metric-value">RWF {pendingEscrow.toLocaleString()}</div>
                    <div className="metric-sub">Held securely in smart contract</div>
                </div>
                <div className="metric-card">
                    <span className="metric-label">
                        Ledger Events
                    </span>
                    <div className="metric-value">{transactions.length}</div>
                    <div className="metric-sub">Total verified contract audits</div>
                </div>
            </div>

            {/* TENANT RENT PAYMENT PORTAL */}
            {!isLandlord && activeLeases.length > 0 && (
                <div style={{ marginBottom: '48px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700, color: 'var(--dark-slate)' }}>Upcoming Rental Obligations</h2>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {activeLeases.map(lease => (
                            <div key={lease.id} className="dash-card" style={{ borderTop: '4px solid var(--accent)' }}>
                                <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Active Contract</div>
                                        <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--dark-slate)' }}>
                                            CT-{lease.id.substring(0, 8).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Standard Rental Due</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.85rem', color: 'var(--dark-slate)', letterSpacing: '-0.02em' }}>
                                            RWF {lease.rent_amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-dark"
                                        style={{ width: '100%', borderRadius: '8px', padding: '12px' }}
                                        disabled={processing}
                                        onClick={() => handlePayRent(lease)}
                                    >
                                        {processing ? 'Signing ledger transfer...' : 'Pay Rent Now'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FULL TRANSACTION LEDGER */}
            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700, color: 'var(--dark-slate)' }}>Transaction History</h2>
            {transactions.length === 0 ? (
                <div className="dash-card" style={{ padding: '60px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
                        <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5m-9 7v3m0-3h6m-6 0H9" />
                    </svg>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>No payment logs recorded on the ledger yet.</p>
                </div>
            ) : (
                <div className="dash-card" style={{ padding: 0 }}>
                    <div className="table-wrap">
                        <table style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Event Date</th>
                                    <th>Asset Source</th>
                                    <th>Action Type</th>
                                    <th>Amount (RWF)</th>
                                    <th>Status</th>
                                    <th>Audit Trace</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--dark-slate)', fontSize: '0.92rem' }}>{t.property_address || 'Property Listing'}</div>
                                            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                Lease Ref: {t.lease_id?.substring(0, 8).toUpperCase() || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {t.action}
                                        </td>
                                        <td style={{ fontWeight: 800, color: t.action === 'CollectRent' ? 'var(--success)' : 'var(--text-primary)' }}>
                                            {t.action === 'CollectRent' ? '+' : ''}RWF {t.amount.toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`badge ${t.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            {t.tx_hash ? (
                                                <a href={`https://preprod.cardanoscan.io/transaction/${t.tx_hash}`} target="_blank" rel="noreferrer" className="link-arrow dark" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                                    Explorer &rarr;
                                                </a>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Local Cache</span>
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
