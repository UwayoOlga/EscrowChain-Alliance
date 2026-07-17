import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

// ── Inline SVG icon set — no emoji, no image deps ──────────────────────────
const Icon = ({ d, size = 18, color = 'currentColor', strokeWidth = 1.75 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const ICONS = {
    occupancy:  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    revenue:    'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    escrow:     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
    disputes:   'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
    calendar:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    lock:       'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4',
    paid:       'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    home:       'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    bed:        'M3 7v11m0-7h18m0 0v7m0-7a2 2 0 00-2-2H9a2 2 0 00-2 2',
    bath:       'M4 12h16M4 12a2 2 0 01-2-2V8a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 01-2 2M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7',
    check:      'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    alert:      'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
    wrench:     'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z',
    file:       'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
};

function StatCard({ icon, label, value, sub, accentColor, dimmed }) {
    const leftBorderStyle = accentColor ? { borderLeft: `3px solid ${accentColor}` } : {};
    return (
        <div className="metric-card" style={leftBorderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ 
                    width: '32px', height: '32px', 
                    borderRadius: '6px', 
                    background: accentColor ? `${accentColor}14` : 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: accentColor || 'var(--text-muted)',
                    flexShrink: 0
                }}>
                    <Icon d={icon} size={16} color={accentColor || 'var(--text-muted)'} />
                </div>
                <span className="metric-label" style={{ margin: 0 }}>{label}</span>
            </div>
            <div className="metric-value" style={accentColor ? { color: accentColor } : {}}>{value}</div>
            <div className="metric-sub">{sub}</div>
        </div>
    );
}

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

        loadDashboard();
        const interval = setInterval(loadDashboard, 10000);
        const initialTimer = setTimeout(() => setLoading(false), 800);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimer);
        };
    }, [user]);

    if (loading) return <div className="page container"><p>Loading dashboard...</p></div>;

    const isLandlord = user?.role?.toLowerCase() === 'landlord';
    const myProperties = properties.filter(p => p.landlord_id === user.id);
    const myLeases = leases.filter(l => isLandlord ? l.landlord_id === user.id : l.tenant_id === user.id);
    const activeLeases = myLeases.filter(l => l.status === 'active');
    const pendingLeases = myLeases.filter(l => l.status === 'pending');
    const activeDisputes = disputes.filter(d => d.status === 'pending');

    const confirmedTx = transactions.filter(t => t.status === 'confirmed');
    const totalPaid = confirmedTx
        .filter(t => t.action === 'CollectRent' || t.action === 'ContractSigned')
        .reduce((sum, t) => sum + t.amount, 0);
    const escrowBalance = transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);
    const recentPayments = transactions.slice(0, 5);
    const pendingMaintenance = maintenanceRequests.filter(m => m.status === 'pending');

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const firstName = user?.name?.split(' ')[0] || 'there';

    // Build last-6-months revenue from real confirmed transactions
    const revenueByMonth = (() => {
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return { month: d.toLocaleString('default', { month: 'short' }).toUpperCase(), year: d.getFullYear(), monthIdx: d.getMonth(), total: 0 };
        });
        confirmedTx.filter(t => t.action === 'CollectRent').forEach(t => {
            const d = new Date(t.created_at);
            const found = months.find(m => m.monthIdx === d.getMonth() && m.year === d.getFullYear());
            if (found) found.total += t.amount;
        });
        const max = Math.max(...months.map(m => m.total), 1);
        return months.map(m => ({ ...m, pct: Math.round((m.total / max) * 100) }));
    })();

    // ══════════════════════════════════════════════════
    //  LANDLORD DASHBOARD
    // ══════════════════════════════════════════════════
    if (isLandlord) {
        const totalProperties = myProperties.length;
        const occupiedCount = activeLeases.length;
        const occupancyRate = totalProperties > 0 ? (occupiedCount / totalProperties) * 100 : 0;
        const monthlyRunRate = activeLeases.reduce((sum, l) => sum + l.rent_amount, 0);
        const resolvedDisputes = disputes.filter(d => d.status === 'resolved');

        return (
            <div className="dashboard-enterprise fade-in">
                {/* Header */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="dashboard-greeting-title">{getGreeting()}, {firstName}</h1>
                        <p className="dashboard-greeting-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Your portfolio overview — leases, escrow balances, and pending actions.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', background: '#fff' }}>
                        <span className="pulse-dot"></span>
                        Cardano Preprod
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                    <StatCard icon={ICONS.occupancy} label="Occupancy" value={`${occupancyRate.toFixed(1)}%`} sub={`${occupiedCount} of ${totalProperties} units leased`} accentColor="var(--accent)" />
                    <StatCard icon={ICONS.revenue} label="Monthly Run Rate" value={`RWF ${monthlyRunRate.toLocaleString()}`} sub="Expected incoming rent" accentColor="var(--success)" />
                    <StatCard icon={ICONS.escrow} label="Locked Escrow" value={`RWF ${escrowBalance.toLocaleString()}`} sub="Held in smart contracts" accentColor="#D97706" />
                    <StatCard
                        icon={ICONS.disputes}
                        label="Active Disputes"
                        value={String(activeDisputes.length)}
                        sub={`${resolvedDisputes.length} resolved`}
                        accentColor={activeDisputes.length > 0 ? 'var(--danger)' : undefined}
                    />
                </div>

                {/* Main 2-col layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Revenue chart — real data */}
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <h3>Revenue Performance</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last 6 months · RWF</span>
                            </div>
                            <div className="dash-card-body" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 4px 8px 4px' }}>
                                    {revenueByMonth.map((m, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                            <div style={{
                                                width: '100%',
                                                maxWidth: '36px',
                                                background: i === 5 ? 'var(--accent)' : 'var(--bg-secondary)',
                                                border: i === 5 ? 'none' : '1px solid var(--border)',
                                                height: `${Math.max(m.pct, 4)}%`,
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 0.4s ease',
                                            }} />
                                            <div style={{ marginTop: '8px', fontSize: '0.7rem', fontWeight: 700, color: i === 5 ? 'var(--accent)' : 'var(--text-muted)' }}>
                                                {m.month}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent transactions */}
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <h3>Recent Transactions</h3>
                                <Link to="/payments" style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>View all</Link>
                            </div>
                            <div className="table-wrap">
                                <table style={{ border: 'none' }}>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Property</th>
                                            <th>Action</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPayments.map(t => (
                                            <tr key={t.id}>
                                                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                                                <td style={{ fontWeight: 600 }}>{t.property_address || `Ref: ${t.lease_id?.substring(0, 8).toUpperCase()}`}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{t.action}</td>
                                                <td style={{ fontWeight: 700 }}>RWF {t.amount.toLocaleString()}</td>
                                                <td><span className={`badge ${t.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                                            </tr>
                                        ))}
                                        {recentPayments.length === 0 && (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No transactions on record.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Action items */}
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <h3>Action Items</h3>
                            </div>
                            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {activeDisputes.length > 0 && (
                                    <div className="alert-card alert-card--danger">
                                        <div className="alert-card-title" style={{ color: 'var(--danger)' }}>Open Dispute</div>
                                        <div className="alert-card-desc">Case {activeDisputes[0].id.substring(0, 8).toUpperCase()} requires a response.</div>
                                    </div>
                                )}
                                {pendingLeases.length > 0 && (
                                    <div className="alert-card alert-card--warning">
                                        <div className="alert-card-title" style={{ color: 'var(--warning)' }}>Pending Approvals</div>
                                        <div className="alert-card-desc">{pendingLeases.length} lease proposal{pendingLeases.length > 1 ? 's' : ''} awaiting your review.</div>
                                    </div>
                                )}
                                {pendingMaintenance.length > 0 && (
                                    <Link to="/maintenance" style={{ textDecoration: 'none' }}>
                                        <div className="alert-card alert-card--info">
                                            <div className="alert-card-title" style={{ color: 'var(--accent)' }}>Maintenance Requests</div>
                                            <div className="alert-card-desc">{pendingMaintenance.length} open report{pendingMaintenance.length > 1 ? 's' : ''} filed by tenants.</div>
                                        </div>
                                    </Link>
                                )}
                                {activeDisputes.length === 0 && pendingLeases.length === 0 && pendingMaintenance.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                        <Icon d={ICONS.check} size={32} color="var(--success)" />
                                        <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>All clear — no pending actions.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Occupancy summary */}
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <h3>Occupancy</h3>
                            </div>
                            <div className="dash-card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '10px', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Portfolio leased</span>
                                    <span style={{ color: 'var(--dark-slate)' }}>{occupiedCount} / {totalProperties} units</span>
                                </div>
                                <div className="progress-track" style={{ marginBottom: '20px' }}>
                                    <div className="progress-fill" style={{ width: `${occupancyRate}%` }} />
                                </div>
                                <Link to="/properties" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', borderRadius: '6px' }}>
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

    const daysRemaining = activeLease
        ? Math.max(0, Math.ceil((new Date(activeLease.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

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
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="dashboard-greeting-title">{getGreeting()}, {firstName}</h1>
                    <p className="dashboard-greeting-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Your home, upcoming payments, and active lease overview.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', background: '#fff' }}>
                    <span className="pulse-dot"></span>
                    {activeLease ? 'Lease Active' : 'No Active Lease'}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-4" style={{ marginBottom: '32px' }}>
                <StatCard
                    icon={ICONS.home}
                    label="Lease Status"
                    value={activeLease ? 'Active' : 'No Lease'}
                    sub={activeLease ? `${daysRemaining} days remaining` : 'Browse listings to apply'}
                    accentColor={activeLease ? 'var(--success)' : undefined}
                />
                <StatCard
                    icon={ICONS.calendar}
                    label="Next Payment"
                    value={daysUntilPayment !== null ? `${daysUntilPayment} days` : '—'}
                    sub={nextPaymentDate ? nextPaymentDate.toLocaleDateString() : 'No lease active'}
                    accentColor={daysUntilPayment !== null && daysUntilPayment <= 5 ? 'var(--danger)' : undefined}
                />
                <StatCard
                    icon={ICONS.lock}
                    label="Locked Deposit"
                    value={`RWF ${(activeLease?.deposit_amount || 0).toLocaleString()}`}
                    sub="Secured by smart contract"
                    accentColor="#D97706"
                />
                <StatCard
                    icon={ICONS.paid}
                    label="Total Paid"
                    value={`RWF ${totalPaid.toLocaleString()}`}
                    sub="Confirmed on-chain transfers"
                    accentColor="var(--success)"
                />
            </div>

            {/* Main 2-col layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* My Home card */}
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3>My Home</h3>
                            {activeLease && <Link to={`/properties/${activeLease.property_id}`} style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>View listing</Link>}
                        </div>
                        <div className="dash-card-body">
                            {activeLease ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Property</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px', color: 'var(--dark-slate)' }}>{myProperty?.title || 'Rental Property'}</div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>{myProperty?.address}</p>
                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Beds</div>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Icon d={ICONS.bed} size={14} color="var(--text-secondary)" />
                                                    {myProperty?.bedrooms || '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Baths</div>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Icon d={ICONS.bath} size={14} color="var(--text-secondary)" />
                                                    {myProperty?.bathrooms || '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Expires</div>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Icon d={ICONS.calendar} size={14} color="var(--text-secondary)" />
                                                    {new Date(activeLease.end_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '32px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Monthly Rent</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-slate)', marginBottom: '24px' }}>RWF {activeLease.rent_amount.toLocaleString()}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <Link to="/payments" className="btn btn-dark" style={{ width: '100%', textAlign: 'center', borderRadius: '6px' }}>Pay Rent</Link>
                                            <Link to={`/properties/${activeLease.property_id}`} className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', borderRadius: '6px' }}>View Property</Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <Icon d={ICONS.home} size={40} color="var(--border-hover)" />
                                    <p style={{ marginTop: '16px', color: 'var(--text-muted)', marginBottom: '24px' }}>You don't have an active lease yet.</p>
                                    <Link to="/marketplace" className="btn btn-primary" style={{ borderRadius: '6px' }}>Browse Listings</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction ledger */}
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3>Transaction History</h3>
                            <Link to="/leases" style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>View all</Link>
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
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{t.action}</td>
                                            <td style={{ fontWeight: 700 }}>RWF {t.amount.toLocaleString()}</td>
                                            <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.tx_hash ? `${t.tx_hash.substring(0, 14)}…` : '—'}</td>
                                            <td><span className={`badge ${t.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No on-chain history found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Rent due */}
                    {activeLease && (
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <h3>Rent Due</h3>
                            </div>
                            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount</span>
                                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--dark-slate)' }}>RWF {activeLease.rent_amount.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Due date</span>
                                    <span style={{ fontWeight: 600 }}>{nextPaymentDate?.toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Time left</span>
                                    <span style={{ fontWeight: 700, color: daysUntilPayment <= 5 ? 'var(--danger)' : 'var(--dark-slate)' }}>
                                        {daysUntilPayment} {daysUntilPayment === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                                    <Link to="/payments" className="btn btn-dark" style={{ width: '100%', textAlign: 'center', borderRadius: '6px' }}>
                                        Pay Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Maintenance */}
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3>Maintenance</h3>
                            <Link to="/maintenance" style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>View all</Link>
                        </div>
                        <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {maintenanceRequests.length > 0 ? maintenanceRequests.slice(0, 3).map(m => (
                                <div key={m.id} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark-slate)' }}>{m.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(m.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`badge ${m.status === 'pending' ? 'badge-warning' : m.status === 'in-progress' ? 'badge-info' : 'badge-success'}`}>
                                        {m.status}
                                    </span>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                    <Icon d={ICONS.check} size={28} color="var(--success)" />
                                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No open maintenance issues.</p>
                                </div>
                            )}
                            <Link to="/maintenance" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', borderRadius: '6px', marginTop: '4px' }}>
                                File New Request
                            </Link>
                        </div>
                    </div>

                    {/* Escrow & Quick actions */}
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3>Escrow Vault</h3>
                        </div>
                        <div className="dash-card-body">
                            <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Locked Deposit</span>
                                    <span style={{ color: 'var(--dark-slate)' }}>RWF {(activeLease?.deposit_amount || 0).toLocaleString()}</span>
                                </div>
                                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                                    Secured by a Cardano smart contract. Released only at lease completion.
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Link to="/documents" className="btn btn-secondary" style={{ textAlign: 'center', borderRadius: '6px' }}>My Documents</Link>
                                <Link to="/disputes" className="btn btn-secondary" style={{ textAlign: 'center', borderRadius: '6px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>File a Dispute</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
