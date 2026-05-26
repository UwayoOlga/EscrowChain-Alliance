import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Dashboard() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getProperties().catch(() => []),
            api.getLeases().catch(() => [])
        ]).then(([props, leas]) => {
            setProperties(Array.isArray(props) ? props : []);
            setLeases(Array.isArray(leas) ? leas : []);
            setLoading(false);
        });
    }, []);

    const activeLeases = leases.filter(l => l.status === 'active');
    const pendingLeases = leases.filter(l => l.status === 'pending');

    // Landlord Metrics
    const myProperties = properties.filter(p => p.landlord_id === user?.id);
    const totalYield = activeLeases.reduce((sum, l) => sum + (l.rent_amount || 0), 0);
    const tenantRentOutput = activeLeases.reduce((sum, l) => sum + (l.rent_amount || 0), 0);
    const tenantEscrowLocked = leases.reduce((sum, l) => sum + (l.deposit_amount || 0), 0);

    if (loading) return <div className="page container"><p>Loading...</p></div>;

    return (
        <div className="page container fade-in">
            <div className="page-header" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <span className="text-overline">Enterprise Portal</span>
                <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>Welcome back, {user?.name}</h1>
                <p>Dashboard Overview / <strong>{user?.role.toUpperCase()} VIEW</strong></p>
            </div>

            {user?.role === 'landlord' ? (
                <>
                    <div className="grid grid-4" style={{ marginBottom: 40 }}>
                        <div className="card stat-card" style={{ borderTop: '4px solid var(--dark-slate)' }}>
                            <div className="stat-value">{myProperties.length}</div>
                            <div className="stat-label">Portfolio Assets</div>
                        </div>
                        <div className="card stat-card" style={{ borderTop: '4px solid var(--accent)' }}>
                            <div className="stat-value">{activeLeases.length}</div>
                            <div className="stat-label">Active Contracts</div>
                        </div>
                        <div className="card stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                            <div className="stat-value">₳ {totalYield}</div>
                            <div className="stat-label">Monthly Gross Yield</div>
                        </div>
                        <div className="card stat-card" style={{ borderTop: '4px solid var(--warning)' }}>
                            <div className="stat-value">{pendingLeases.length}</div>
                            <div className="stat-label">Pending Signatures</div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-3" style={{ marginBottom: 40 }}>
                        <div className="card stat-card" style={{ borderTop: '4px solid var(--accent)' }}>
                            <div className="stat-value">{activeLeases.length}</div>
                            <div className="stat-label">Active Contracts</div>
                        </div>
                        <div className="card stat-card" style={{ borderTop: '4px solid var(--dark-slate)' }}>
                            <div className="stat-value">
                                ₳ {tenantRentOutput}
                            </div>
                            <div className="stat-label">Next Rent Due</div>
                        </div>
                        <div className="card stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                            <div className="stat-value">
                                ₳ {tenantEscrowLocked}
                            </div>
                            <div className="stat-label">Total Escrow Locked</div>
                        </div>
                    </div>
                </>
            )}

            <div className="grid grid-2">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>{user?.role === 'landlord' ? 'Your Portfolio' : 'Market Properties'}</h3>
                        <Link to="/properties" className="btn btn-secondary btn-sm btn-square">View All</Link>
                    </div>
                    {properties.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                            <p style={{ marginBottom: '16px' }}>No properties found</p>
                            {user?.role === 'landlord' && (
                                <Link to="/properties" className="btn btn-primary btn-sm btn-square">Add First Property</Link>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {(user?.role === 'landlord' ? myProperties : properties).slice(0, 4).map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--dark-slate)' }}>{p.address}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>₳ {p.rent_amount} / month • Deposit: ₳ {p.deposit_amount}</div>
                                    </div>
                                    <span className={`badge ${p.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                                        {p.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>Escrow Contracts</h3>
                        <Link to="/leases" className="btn btn-secondary btn-sm btn-square">Manage Contracts</Link>
                    </div>
                    {leases.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                            <p style={{ marginBottom: '16px' }}>No active contracts</p>
                            <Link to="/leases" className="btn btn-secondary btn-sm btn-square">Find Contracts</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {leases.slice(0, 4).map(l => (
                                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--dark-slate)' }}>Agreement #{l.id}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {l.start_date} &rarr; {l.end_date}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--dark-slate)' }}>₳ {l.rent_amount}/mo</span>
                                        <span className={`badge ${l.status === 'active' ? 'badge-success' : l.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                                            {l.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
