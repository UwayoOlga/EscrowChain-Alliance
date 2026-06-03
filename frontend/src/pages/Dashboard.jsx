import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Dashboard() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [leases, setLeases] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [maintenanceRequests, setMaintenanceRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetches = [
            api.getProperties(),
            api.getLeases(),
            api.getTransactions(),
            api.getDisputes(),
            api.getMaintenanceRequests()
        ];
        Promise.all(fetches).then(([p, l, t, d, m]) => {
            setProperties(p || []);
            setLeases(l || []);
            setTransactions(t || []);
            setDisputes(d || []);
            setMaintenanceRequests(m || []);
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            setLoading(false);
        });
    }, [user]);

    if (loading) return <div className="page container"><p>Loading Portfolio Data...</p></div>;

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    // Role-specific stats
    const myProperties = properties.filter(p => p.landlord_id === user.id);
    const myLeases = leases.filter(l => isLandlord ? l.landlord_id === user.id : l.tenant_id === user.id);
    const activeLeases = myLeases.filter(l => l.status === 'active');
    const pendingLeases = myLeases.filter(l => l.status === 'pending');
    const activeDisputes = disputes.filter(d => d.status === 'pending');

    // Financial Stats
    const totalTransactions = transactions.filter(t => t.status === 'confirmed');
    const totalEarnings = totalTransactions
        .filter(t => t.action === (isLandlord ? 'CollectRent' : 'None'))
        .reduce((sum, t) => sum + t.amount, 0);

    const totalPaid = totalTransactions
        .filter(t => t.action === 'CollectRent' || t.action === 'ContractSigned')
        .reduce((sum, t) => sum + t.amount, 0);

    const escrowBalance = transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

    const recentPayments = transactions.slice(0, 5);

    // Maintenance stats
    const pendingMaintenance = maintenanceRequests.filter(m => m.status === 'pending');
    const inProgressMaintenance = maintenanceRequests.filter(m => m.status === 'in-progress');

    // ══════════════════════════════════════════════════
    //  LANDLORD DASHBOARD
    // ══════════════════════════════════════════════════
    if (isLandlord) {
        const totalProperties = myProperties.length;
        const occupiedCount = activeLeases.length;
        const occupancyRate = totalProperties > 0 ? (occupiedCount / totalProperties) * 100 : 0;

        return (
            <div className="dashboard-enterprise fade-in">
                <div className="dashboard-intro" style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-slate)' }}>Management Overview</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Executive audit of your real estate portfolio performance.</p>
                </div>

                <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                    <div className="card metric-card" style={{ borderTop: 'none' }}>
                        <span className="metric-label">Occupancy Rate</span>
                        <div className="metric-value">{occupancyRate.toFixed(1)}%</div>
                        <div className="metric-sub">{occupiedCount} of {totalProperties} Units</div>
                    </div>
                    <div className="card metric-card" style={{ borderTop: 'none' }}>
                        <span className="metric-label">Total Realized Yield</span>
                        <div className="metric-value">RWF {totalEarnings.toLocaleString()}</div>
                        <div className="metric-sub">Confirmed Ledger Transfers</div>
                    </div>
                    <div className="card metric-card" style={{ borderTop: 'none' }}>
                        <span className="metric-label">In Escrow (Pending)</span>
                        <div className="metric-value">RWF {escrowBalance.toLocaleString()}</div>
                        <div className="metric-sub">Funds in Smart Contract</div>
                    </div>
                    <div className="card metric-card" style={{ borderLeft: activeDisputes.length > 0 ? '4px solid var(--danger)' : '' }}>
                        <span className="metric-label">Active Disputes</span>
                        <div className="metric-value" style={{ color: activeDisputes.length > 0 ? 'var(--danger)' : '' }}>{activeDisputes.length}</div>
                        <div className="metric-sub">Requiring Mediation</div>
                    </div>
                </div>

                <div className="dashboard-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
                    <div className="dashboard-main-col">
                        <div className="card" style={{ marginBottom: '32px', height: '300px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Revenue Performance</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 6 Months (RWF)</span>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 12px' }}>
                                {[40, 65, 45, 80, 55, 90].map((h, i) => (
                                    <div key={i} style={{ flex: 1, background: i === 5 ? 'var(--dark-slate)' : 'var(--bg-secondary)', height: `${h}%`, borderRadius: '2px', position: 'relative', transition: 'height 0.6s ease' }}>
                                        <div style={{ position: 'absolute', bottom: '-24px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'][i]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Ledger Activity</h3>
                                <Link to="/payments" className="link-arrow dark" style={{ fontSize: '0.85rem' }}>Full History &rarr;</Link>
                            </div>
                            <div className="table-wrap">
                                <table style={{ border: 'none' }}>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Asset</th>
                                            <th>Action</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPayments.map(t => (
                                            <tr key={t.id}>
                                                <td style={{ fontSize: '0.85rem' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                                                <td style={{ fontWeight: 600 }}>{t.property_address || 'Ref: ' + t.lease_id?.substring(0, 8)}</td>
                                                <td>{t.action}</td>
                                                <td style={{ fontWeight: 700 }}>RWF {t.amount}</td>
                                                <td><span className={`badge ${t.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                                            </tr>
                                        ))}
                                        {recentPayments.length === 0 && (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px' }}>No recent financial events.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-side-col">
                        <div className="card" style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Priority Alerts</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {activeDisputes.length > 0 && (
                                    <div className="card" style={{ padding: '16px', background: 'var(--danger-bg)', border: 'none', boxShadow: 'none' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.85rem' }}>Conflict Management Required</div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Case-{activeDisputes[0].id.substring(0, 8)} awaiting your response.</p>
                                    </div>
                                )}
                                {pendingLeases.length > 0 && (
                                    <div className="card" style={{ padding: '16px', background: 'var(--warning-bg)', border: 'none', boxShadow: 'none' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '0.85rem' }}>Lease Proposal Status</div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pendingLeases.length} proposals pending tenant signature.</p>
                                    </div>
                                )}
                                {pendingMaintenance.length > 0 && (
                                    <Link to="/maintenance" style={{ textDecoration: 'none' }}>
                                        <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none', boxShadow: 'none' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--dark-slate)', fontSize: '0.85rem' }}>Maintenance Requests</div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pendingMaintenance.length} pending tenant request(s) need review.</p>
                                        </div>
                                    </Link>
                                )}
                                {activeDisputes.length === 0 && pendingLeases.length === 0 && pendingMaintenance.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-hover)" strokeWidth="1.5" style={{ marginBottom: '12px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Protocol state: Stable.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Asset Summary</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Portfolio Occupancy</span>
                                    <span style={{ fontWeight: 700 }}>{occupiedCount} / {totalProperties}</span>
                                </div>
                                <div className="progress-bar" style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--dark-slate)', width: `${occupancyRate}%`, transition: 'width 0.8s ease' }}></div>
                                </div>
                            </div>
                            <Link to="/properties" className="btn btn-secondary btn-sm btn-square" style={{ width: '100%', marginTop: '24px' }}>
                                Manage Properties
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════
    //  TENANT DASHBOARD
    // ══════════════════════════════════════════════════
    const activeLease = activeLeases[0];
    const myProperty = activeLease ? properties.find(p => p.id === activeLease.property_id) : null;

    // Days until lease expiry
    const daysRemaining = activeLease
        ? Math.max(0, Math.ceil((new Date(activeLease.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

    // Days until next rent (assume monthly from start_date)
    const nextPaymentDate = activeLease ? (() => {
        const start = new Date(activeLease.start_date);
        const now = new Date();
        const next = new Date(start);
        while (next <= now) next.setMonth(next.getMonth() + 1);
        return next;
    })() : null;

    const daysUntilPayment = nextPaymentDate
        ? Math.ceil((nextPaymentDate - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="dashboard-enterprise fade-in">
            <div className="dashboard-intro" style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-slate)' }}>
                    Welcome back, {user?.name?.split(' ')[0] || 'Tenant'}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Your rental overview and upcoming obligations.</p>
            </div>

            {/* METRIC CARDS */}
            <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                <div className="card metric-card" style={{ borderTop: 'none' }}>
                    <span className="metric-label">Rental Status</span>
                    <div className="metric-value" style={{ fontSize: '1.2rem', color: activeLease ? 'var(--success)' : 'var(--text-muted)' }}>
                        {activeLease ? 'LEASE ACTIVE' : 'NO ACTIVE LEASE'}
                    </div>
                    <div className="metric-sub">{activeLease ? `${daysRemaining} days remaining` : 'Available to rent'}</div>
                </div>
                <div className="card metric-card" style={{ borderTop: 'none' }}>
                    <span className="metric-label">Next Payment Due</span>
                    <div className="metric-value" style={{ color: daysUntilPayment !== null && daysUntilPayment <= 5 ? 'var(--danger)' : '' }}>
                        {daysUntilPayment !== null ? `${daysUntilPayment}d` : '—'}
                    </div>
                    <div className="metric-sub">{nextPaymentDate ? nextPaymentDate.toLocaleDateString() : 'No upcoming'}</div>
                </div>
                <div className="card metric-card" style={{ borderTop: 'none' }}>
                    <span className="metric-label">Locked Deposit</span>
                    <div className="metric-value">RWF {activeLease?.deposit_amount || 0}</div>
                    <div className="metric-sub">Held in Escrow Contract</div>
                </div>
                <div className="card metric-card" style={{ borderTop: 'none' }}>
                    <span className="metric-label">Total Paid</span>
                    <div className="metric-value">RWF {totalPaid.toLocaleString()}</div>
                    <div className="metric-sub">Verified On-Chain</div>
                </div>
            </div>

            <div className="dashboard-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
                <div className="dashboard-main-col">
                    {/* MY ACTIVE HOME */}
                    <div className="card" style={{ marginBottom: '32px', padding: '40px' }}>
                        <h3 style={{ marginBottom: '24px', fontWeight: 800 }}>My Active Home</h3>
                        {activeLease ? (
                            <div className="grid grid-2" style={{ gap: '32px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Property</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{myProperty?.title || 'Untitled'}</div>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{myProperty?.address}</p>

                                    <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Bedrooms</div>
                                            <div style={{ fontWeight: 600 }}>{myProperty?.bedrooms || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Bathrooms</div>
                                            <div style={{ fontWeight: 600 }}>{myProperty?.bathrooms || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Lease Expiry</div>
                                            <div style={{ fontWeight: 600 }}>{new Date(activeLease.end_date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '32px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Monthly Rent</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-slate)' }}>RWF {activeLease.rent_amount}</div>
                                    <Link to="/leases" className="btn btn-dark btn-square" style={{ width: '100%', marginTop: '24px', textDecoration: 'none', textAlign: 'center' }}>Pay Current Rent</Link>
                                    <Link to={`/properties/${activeLease.property_id}`} className="btn btn-secondary btn-square" style={{ width: '100%', marginTop: '8px', textDecoration: 'none', textAlign: 'center' }}>View Property Details</Link>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hover)" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You do not have any active lease agreements at this time.</p>
                                <Link to="/properties" className="btn btn-primary btn-square">Browse Verified Properties</Link>
                            </div>
                        )}
                    </div>

                    {/* TRANSACTION LEDGER */}
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>My Transaction Ledger</h3>
                            <Link to="/leases" className="link-arrow dark" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>Full History &rarr;</Link>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Tx Hash</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length > 0 ? transactions.slice(0, 5).map(t => (
                                        <tr key={t.id}>
                                            <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                            <td>{t.action}</td>
                                            <td style={{ fontWeight: 700 }}>RWF {t.amount}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.tx_hash ? t.tx_hash.substring(0, 16) + '...' : '—'}</td>
                                            <td><span className={`badge ${t.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No on-chain history found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="dashboard-side-col">
                    {/* UPCOMING PAYMENT CARD */}
                    <div className="card" style={{ marginBottom: '32px', borderTop: daysUntilPayment !== null && daysUntilPayment <= 5 ? '4px solid var(--danger)' : '4px solid var(--dark-slate)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Upcoming Payment</h3>
                        {activeLease ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount Due</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>RWF {activeLease.rent_amount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Due Date</span>
                                    <span style={{ fontWeight: 600 }}>{nextPaymentDate?.toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Days Left</span>
                                    <span style={{ fontWeight: 700, color: daysUntilPayment <= 5 ? 'var(--danger)' : 'var(--dark-slate)' }}>
                                        {daysUntilPayment} {daysUntilPayment === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                                <Link to="/leases" className="btn btn-dark btn-square" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                                    Pay Now
                                </Link>
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No upcoming payments.</p>
                        )}
                    </div>

                    {/* MAINTENANCE STATUS */}
                    <div className="card" style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Maintenance Status</h3>
                            <Link to="/maintenance" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>View All &rarr;</Link>
                        </div>
                        {maintenanceRequests.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {maintenanceRequests.slice(0, 3).map(m => (
                                    <div key={m.id} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <span className={`badge ${m.status === 'pending' ? 'badge-warning' : m.status === 'in-progress' ? 'badge-info' : m.status === 'resolved' ? 'badge-success' : 'badge-danger'}`}>
                                            {m.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--border-hover)" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All systems operational.</p>
                            </div>
                        )}
                        <Link to="/maintenance" className="btn btn-secondary btn-sm btn-square" style={{ width: '100%', marginTop: '16px', textDecoration: 'none', textAlign: 'center' }}>
                            File New Request
                        </Link>
                    </div>

                    {/* SECURITY & ESCROW */}
                    <div className="card" style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Security & Escrow</h3>
                        <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deposit Locked</span>
                                <span style={{ fontWeight: 700 }}>RWF {activeLease?.deposit_amount || 0}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                Secured by multi-sig smart contract on Cardano. Released upon mutual agreement.
                            </p>
                        </div>
                        <Link to="/leases" className="btn btn-secondary btn-sm btn-square" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                            View Contract Protocol
                        </Link>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Link to="/documents" className="btn btn-secondary btn-sm btn-square" style={{ textDecoration: 'none', textAlign: 'center' }}>
                                View Documents
                            </Link>
                            <Link to="/disputes" className="btn btn-danger btn-sm btn-square" style={{ textDecoration: 'none', textAlign: 'center' }}>
                                Initiate Dispute Resolution
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
