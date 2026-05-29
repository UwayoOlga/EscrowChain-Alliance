import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Payments() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getTransactions()
            .then(data => setTransactions(Array.isArray(data) ? data : []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page container"><p>Loading Financial Ledger...</p></div>;

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    const totalVolume = transactions
        .filter(t => t.action === 'CollectRent' && t.status === 'confirmed')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingEscrow = transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="page container fade-in">
            <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '32px' }}>
                <span className="text-overline">Financial Governance</span>
                <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>Asset Transaction Ledger</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {isLandlord
                        ? 'Track automated escrow distributions and rental income across your property portfolio.'
                        : 'Review your historical payment logs and escrowed security deposits on the Cardano network.'}
                </p>
            </div>

            <div className="grid grid-3" style={{ marginBottom: 48 }}>
                <div className="card stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                    <div className="stat-value">₳ {totalVolume.toLocaleString()}</div>
                    <div className="stat-label">{isLandlord ? 'Total Realized Yield' : 'Total Cumulative Payments'}</div>
                </div>
                <div className="card stat-card" style={{ borderTop: '4px solid var(--warning)' }}>
                    <div className="stat-value">₳ {pendingEscrow.toLocaleString()}</div>
                    <div className="stat-label">{isLandlord ? 'Funds in Transit' : 'In Escrow (Pre-Lock)'}</div>
                </div>
                <div className="card stat-card" style={{ borderTop: '4px solid var(--dark-slate)' }}>
                    <div className="stat-value">{transactions.length}</div>
                    <div className="stat-label">Total Smart Events</div>
                </div>
            </div>

            <h2 style={{ marginBottom: 24, fontSize: '1.5rem', color: 'var(--dark-slate)' }}>Transaction History</h2>
            {transactions.length === 0 ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No financial events recorded yet.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Event Date</th>
                                    <th>Asset Source</th>
                                    <th>Action Type</th>
                                    <th>Amount (₳)</th>
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
                                            <div style={{ fontWeight: 600 }}>{t.property_address}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lease: {t.lease_uid.substring(0, 8)}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 500 }}>{t.action}</span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: t.action === 'CollectRent' ? 'var(--success)' : 'var(--text-primary)' }}>
                                            {t.action === 'CollectRent' ? '+' : ''}₳ {t.amount}
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
