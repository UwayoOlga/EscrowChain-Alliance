import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Leases() {
    const { user } = useAuth();
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        api.getLeases()
            .then(data => setLeases(Array.isArray(data) ? data : []))
            .catch(() => setLeases([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

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
            pending: 'badge-warning',
            completed: 'badge-info',
            cancelled: 'badge-danger'
        };
        return map[status] || 'badge-info';
    };

    if (loading) return <div className="page container"><p>Loading...</p></div>;

    return (
        <div className="page container fade-in">
            <div className="page-header" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <span className="text-overline">Contract Explorer</span>
                <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>Smart Contract Agreements</h1>
                <p>Monitor your active escrow balances and programmatic real estate leases.</p>
            </div>

            {leases.length === 0 ? (
                <div className="card empty-state" style={{ padding: '80px 20px', backgroundColor: 'var(--bg-secondary)' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Active Contracts</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Lease generation workflows must be initiated from verified physical assets.</p>
                </div>
            ) : (
                <div className="table-wrap card" style={{ padding: 0, overflow: 'hidden', borderTop: '4px solid var(--dark-slate)' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Escrow Reference</th>
                                <th>Monthly Allocation (₳)</th>
                                <th>Deposit Target (₳)</th>
                                <th>Contract Period</th>
                                <th>Execution Status</th>
                                <th>Signatures</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leases.map(l => (
                                <tr key={l.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--dark-slate)' }}>CTL-{l.id.toString().padStart(4, '0')}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>₳ {l.rent_amount}</td>
                                    <td>₳ {l.deposit_amount}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {l.start_date} &rarr; {l.end_date}
                                    </td>
                                    <td><span className={`badge ${statusBadge(l.status)}`}>{l.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {l.status === 'pending' && (
                                                <button className="btn btn-primary btn-sm btn-square" onClick={() => updateStatus(l.id, 'active')}>
                                                    Approve Handshake
                                                </button>
                                            )}
                                            {l.status === 'active' && (
                                                <>
                                                    <button className="btn btn-secondary btn-sm btn-square" onClick={() => updateStatus(l.id, 'completed')}>
                                                        Finalize
                                                    </button>
                                                    <button className="btn btn-danger btn-sm btn-square" onClick={() => updateStatus(l.id, 'cancelled')} style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                                                        Void
                                                    </button>
                                                </>
                                            )}
                                            {(l.status === 'completed' || l.status === 'cancelled') && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked</span>
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
