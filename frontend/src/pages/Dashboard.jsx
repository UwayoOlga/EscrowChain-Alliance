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

        const loadDashboard = () => {
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
                console.error('Dashboard sync error:', err);
            });
        };

        // Initial load
        loadDashboard();

        // ── DASHBOARD SYNC: Refresh all metrics every 10s ──
        const interval = setInterval(loadDashboard, 10000);

        // Turn off loading once initial data is processed
        const initialTimer = setTimeout(() => setLoading(false), 800);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimer);
        };
    }, [user]);

    if (loading) return <div className="page container"><p>Syncing ledger details...</p></div>;

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const firstName = user?.name?.split(' ')[0] || 'there';

    // ══════════════════════════════════════════════════
    //  LANDLORD DASHBOARD
    // ══════════════════════════════════════════════════
    if (isLandlord) {
        const totalProperties = myProperties.length;
        const occupiedCount = activeLeases.length;
        const occupancyRate = totalProperties > 0 ? (occupiedCount / totalProperties) * 100 : 0;

        // Advanced Revenue Metrics
        const monthlyRunRate = activeLeases.reduce((sum, l) => sum + l.rent_amount, 0);
        const resolvedDisputes = disputes.filter(d => d.status === 'resolved');

        return (
            <div className="dashboard-enterprise fade-in">
                {/* Header Greeting */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="dashboard-greeting-title">{getGreeting()}, {firstName}</h1>
                        <p className="dashboard-greeting-subtitle">Here's a human look at your rental portfolio and smart contracts.</p>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600 }}>
                        <span className="pulse-dot"></span>
                        Cardano Preprod Live
                    </div>
                </div>

                {/* DeFi Style Metric Cards */}
                <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                    <div className="metric-card metric-card--accent fade-in stagger-1">
                        <span className="metric-label">
                            🔑 Occupancy Rate
                        </span>
                        <div className="metric-value">{occupancyRate.toFixed(1)}%</div>
                        <div className="metric-sub">{occupiedCount} of {totalProperties} units currently leased</div>
                    </div>
                    <div className="metric-card metric-card--success fade-in stagger-2">
                        <span className="metric-label">
                            📈 Monthly Revenue
                        </span>
                        <div className="metric-value">RWF {monthlyRunRate.toLocaleString()}</div>
                        <div className="metric-sub">Expected monthly incoming rent</div>
                    </div>
                    <div className="metric-card metric-card--warning fade-in stagger-3">
                        <span className="metric-label">
                            🛡️ Locked Escrow
                        </span>
                        <div className="metric-value">RWF {escrowBalance.toLocaleString()}</div>
                        <div className="metric-sub">Deposit values secured in smart contracts</div>
                    </div>
                    <div className="metric-card fade-in stagger-4" style={{ borderLeft: activeDisputes.length > 0 ? '4px solid var(--danger)' : '' }}>
                        <span className="metric-label">
                            ⚠️ Active Disputes
                        </span>
                        <div className="metric-value" style={{ color: activeDisputes.length > 0 ? 'var(--danger)' : '' }}>
                            {activeDisputes.length}
                        </div>
                        <div className="metric-sub">{resolvedDisputes.length} conflicts resolved so far</div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="dashboard-row" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '32px' }}>
                    <div className="dashboard-main-col">
                        {/* Revenue Performance card */}
                        <div className="dash-card fade-in stagger-2" style={{ marginBottom: '32px' }}>
                            <div className="dash-card-header">
                                <h3>Revenue Performance</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last 6 Months (RWF)</span>
                            </div>
                            <div className="dash-card-body" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '0 8px 12px 8px' }}>
                                    {[40, 65, 45, 80, 55, 90].map((h, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                            <div style={{ 
                                                width: '100%', 
                                                maxWidth: '42px',
                                                background: i === 5 
                                                    ? 'linear-gradient(180deg, var(--accent) 0%, #3B82F6 100%)' 
                                                    : 'linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)', 
                                                height: `${h}%`, 
                                                borderRadius: '6px 6px 0 0', 
                                                position: 'relative', 
                                                transition: 'height 0.6s ease',
                                                boxShadow: i === 5 ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
                                            }} />
                                            <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'][i]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Ledger activity */}
                        <div className="dash-card fade-in stagger-3">
                            <div className="dash-card-header">
                                <h3>Recent Ledger Transactions</h3>
                                <Link to="/payments" className="link-arrow dark" style={{ fontSize: '0.85rem' }}>View full history &rarr;</Link>
                            </div>
                            <div className="table-wrap">
                                <table style={{ border: 'none' }}>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Property / Lease</th>
                                            <th>Action</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPayments.map(t => (
                                            <tr key={t.id}>
                                                <td style={{ fontSize: '0.85rem' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                                                <td style={{ fontWeight: 600 }}>{t.property_address || 'Ref: ' + t.lease_id?.substring(0, 8).toUpperCase()}</td>
                                                <td>{t.action}</td>
                                                <td style={{ fontWeight: 700 }}>RWF {t.amount.toLocaleString()}</td>
                                                <td><span className={`badge ${t.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                                            </tr>
                                        ))}
                                        {recentPayments.length === 0 && (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No recent financial events.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-side-col">
                        {/* Priority Alerts */}
                        <div className="dash-card fade-in stagger-2" style={{ marginBottom: '32px' }}>
                            <div className="dash-card-header">
                                <h3>Action Items</h3>
                            </div>
                            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {activeDisputes.length > 0 && (
                                    <div className="alert-card alert-card--danger">
                                        <div className="alert-card-title" style={{ color: 'var(--danger)' }}>Dispute Awaiting Response</div>
                                        <div className="alert-card-desc">Case-{activeDisputes[0].id.substring(0, 8).toUpperCase()} requires immediate arbitrator submission.</div>
                                    </div>
                                )}
                                {pendingLeases.length > 0 && (
                                    <div className="alert-card alert-card--warning">
                                        <div className="alert-card-title" style={{ color: 'var(--warning)' }}>Pending Lease Approvals</div>
                                        <div className="alert-card-desc">{pendingLeases.length} proposals waiting on tenant signatures.</div>
                                    </div>
                                )}
                                {pendingMaintenance.length > 0 && (
                                    <Link to="/maintenance" style={{ textDecoration: 'none' }}>
                                        <div className="alert-card alert-card--info">
                                            <div className="alert-card-title" style={{ color: 'var(--accent)' }}>Maintenance Request Filed</div>
                                            <div className="alert-card-desc">{pendingMaintenance.length} tenant reports need reviewing.</div>
                                        </div>
                                    </Link>
                                )}
                                {activeDisputes.length === 0 && pendingLeases.length === 0 && pendingMaintenance.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ marginBottom: '12px' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>All caught up! Portfolio is running smoothly.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Portfolio Occupancy summary */}
                        <div className="dash-card fade-in stagger-3">
                            <div className="dash-card-header">
                                <h3>Occupancy Summary</h3>
                            </div>
                            <div className="dash-card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Portfolio Leased</span>
                                    <span style={{ color: 'var(--dark-slate)' }}>{occupiedCount} / {totalProperties} Units</span>
                                </div>
                                <div className="progress-track" style={{ marginBottom: '24px' }}>
                                    <div className="progress-fill" style={{ width: `${occupancyRate}%` }} />
                                </div>
                                <Link to="/properties" className="btn btn-secondary btn-sm btn-square" style={{ width: '100%' }}>
                                    Manage Properties
                                </Link>
                            </div>
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
            {/* Header Greeting */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="dashboard-greeting-title">{getGreeting()}, {firstName}</h1>
                    <p className="dashboard-greeting-subtitle">Your tenant panel, upcoming payments, and lease agreements.</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span className="pulse-dot"></span>
                    Cardano Preprod Active
                </div>
            </div>

            {/* DeFi Style Metric Cards */}
            <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                <div className="metric-card metric-card--accent fade-in stagger-1">
                    <span className="metric-label">🏠 Lease Status</span>
                    <div className="metric-value" style={{ fontSize: '1.25rem', color: activeLease ? 'var(--success)' : 'var(--text-muted)' }}>
                        {activeLease ? 'ACTIVE' : 'NO LEASE'}
                    </div>
                    <div className="metric-sub">{activeLease ? `${daysRemaining} days left on contract` : 'Browse properties to lease'}</div>
                </div>
                <div className="metric-card fade-in stagger-2" style={{ borderLeft: daysUntilPayment !== null && daysUntilPayment <= 5 ? '4px solid var(--danger)' : '' }}>
                    <span className="metric-label">📅 Next Rent Payment</span>
                    <div className="metric-value" style={{ color: daysUntilPayment !== null && daysUntilPayment <= 5 ? 'var(--danger)' : 'var(--dark-slate)' }}>
                        {daysUntilPayment !== null ? `${daysUntilPayment} days` : '—'}
                    </div>
                    <div className="metric-sub">{nextPaymentDate ? nextPaymentDate.toLocaleDateString() : 'No payments scheduled'}</div>
                </div>
                <div className="metric-card metric-card--warning fade-in stagger-3">
                    <span className="metric-label">🔒 Escrow Deposit</span>
                    <div className="metric-value">RWF {(activeLease?.deposit_amount || 0).toLocaleString()}</div>
                    <div className="metric-sub">Secured in smart contract</div>
                </div>
                <div className="metric-card metric-card--success fade-in stagger-4">
                    <span className="metric-label">💸 Total Paid</span>
                    <div className="metric-value">RWF {totalPaid.toLocaleString()}</div>
                    <div className="metric-sub">All rent payments processed</div>
                </div>
            </div>

            <div className="dashboard-row" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '32px' }}>
                <div className="dashboard-main-col">
                    {/* Active home info */}
                    <div className="dash-card fade-in stagger-2" style={{ marginBottom: '32px' }}>
                        <div className="dash-card-header">
                            <h3>My Home</h3>
                        </div>
                        <div className="dash-card-body">
                            {activeLease ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Property</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>{myProperty?.title || 'Home'}</div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>{myProperty?.address}</p>

                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Bedrooms</div>
                                                <div style={{ fontWeight: 600 }}>🛏️ {myProperty?.bedrooms || '—'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Bathrooms</div>
                                                <div style={{ fontWeight: 600 }}>🚿 {myProperty?.bathrooms || '—'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Expires On</div>
                                                <div style={{ fontWeight: 600 }}>📅 {new Date(activeLease.end_date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '32px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Monthly Rent</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-slate)', marginBottom: '24px' }}>RWF {activeLease.rent_amount.toLocaleString()}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <Link to="/leases" className="btn btn-dark btn-square" style={{ width: '100%', textAlign: 'center' }}>Pay Current Rent</Link>
                                            <Link to={`/properties/${activeLease.property_id}`} className="btn btn-secondary btn-square" style={{ width: '100%', textAlign: 'center' }}>View Details</Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hover)" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You don't have any active lease agreements at the moment.</p>
                                    <Link to="/marketplace" className="btn btn-primary btn-square">Browse Available Properties</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction Ledger */}
                    <div className="dash-card fade-in stagger-3">
                        <div className="dash-card-header">
                            <h3>Lease Transaction History</h3>
                            <Link to="/leases" className="link-arrow dark" style={{ fontSize: '0.85rem' }}>View full history &rarr;</Link>
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
                                            <td style={{ fontWeight: 700 }}>RWF {t.amount.toLocaleString()}</td>
                                            <td className="mono" style={{ fontSize: '0.8rem' }}>{t.tx_hash ? t.tx_hash.substring(0, 16) + '...' : '—'}</td>
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
                    {/* Upcoming payment card */}
                    {activeLease && (
                        <div className="dash-card fade-in stagger-2" style={{ marginBottom: '32px' }}>
                            <div className="dash-card-header">
                                <h3>Rent Due</h3>
                            </div>
                            <div className="dash-card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount Due</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>RWF {activeLease.rent_amount.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Due Date</span>
                                    <span style={{ fontWeight: 600 }}>{nextPaymentDate?.toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Time Left</span>
                                    <span style={{ fontWeight: 700, color: daysUntilPayment <= 5 ? 'var(--danger)' : 'var(--dark-slate)' }}>
                                        {daysUntilPayment} {daysUntilPayment === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                                <Link to="/leases" className="btn btn-dark btn-square" style={{ width: '100%', textAlign: 'center' }}>
                                    Pay Now
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Maintenance requests status */}
                    <div className="dash-card fade-in stagger-3" style={{ marginBottom: '32px' }}>
                        <div className="dash-card-header">
                            <h3>Maintenance</h3>
                            <Link to="/maintenance" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>View all &rarr;</Link>
                        </div>
                        <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {maintenanceRequests.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {maintenanceRequests.slice(0, 3).map(m => (
                                        <div key={m.id} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ marginBottom: '8px' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>No active maintenance issues.</p>
                                </div>
                            )}
                            <Link to="/maintenance" className="btn btn-secondary btn-sm btn-square" style={{ width: '100%', marginTop: '8px', textAlign: 'center' }}>
                                File New Request
                            </Link>
                        </div>
                    </div>

                    {/* Quick actions & Escrow */}
                    <div className="dash-card fade-in stagger-4">
                        <div className="dash-card-header">
                            <h3>Security & Vault</h3>
                        </div>
                        <div className="dash-card-body">
                            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Locked Deposit</span>
                                    <span style={{ color: 'var(--dark-slate)' }}>RWF {(activeLease?.deposit_amount || 0).toLocaleString()}</span>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                                    Secured by a programmatic multi-sig escrow script on the Cardano ledger.
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Link to="/documents" className="btn btn-secondary btn-sm btn-square" style={{ textAlign: 'center' }}>
                                    My Documents Vault
                                </Link>
                                <Link to="/disputes" className="btn btn-danger btn-sm btn-square" style={{ textAlign: 'center' }}>
                                    File Dispute
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
