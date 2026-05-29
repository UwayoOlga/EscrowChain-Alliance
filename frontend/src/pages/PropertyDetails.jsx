import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PropertyDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const [isDrafting, setIsDrafting] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [prospects, setProspects] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [leaseDates, setLeaseDates] = useState({ start: '', end: '' });
    const [submittingLease, setSubmittingLease] = useState(false);

    const isLandlord = user?.role?.toLowerCase() === 'landlord' && property?.landlord_id === user?.id;

    const findTenant = async (e) => {
        e.preventDefault();
        try {
            const results = await api.getProspects(searchEmail);
            setProspects(results);
            if (results.length === 0) alert('No tenant found with that email.');
        } catch (err) {
            console.error(err);
        }
    };

    const submitLease = async () => {
        if (!selectedTenant || !leaseDates.start || !leaseDates.end) {
            alert('Please fill all lease requirements.');
            return;
        }
        setSubmittingLease(true);
        try {
            await api.createLease({
                propertyId: property.id,
                tenantId: selectedTenant.id,
                startDate: leaseDates.start,
                endDate: leaseDates.end
            });
            window.location.reload();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingLease(false);
        }
    };

    useEffect(() => {
        api.getProperty(id)
            .then(data => setProperty(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="page container">Decrypting Asset Metadata...</div>;
    if (!property) return <div className="page container">Asset ID not found in ledger.</div>;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'tenant', label: 'Tenant Entity' },
        { id: 'financials', label: 'Payment Ledger' },
        { id: 'documents', label: 'Documents & Leases' },
        { id: 'escrow', label: 'Escrow State' }
    ];

    const images = property.images ? JSON.parse(property.images) : [];

    return (
        <div className="page-dashboard fade-in" style={{ paddingBottom: '100px' }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Link to="/properties" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
                        Portfolio Return
                    </Link>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>{property.title || 'Property Audit'}</h1>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className={`badge ${property.status === 'available' ? 'badge-info' : 'badge-success'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{property.status}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{property.address}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-slate)' }}>₳ {property.rent_amount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Contract Value</div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', gap: '32px', marginBottom: '40px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '16px 0',
                            border: 'none',
                            background: 'none',
                            fontSize: '0.95rem',
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="grid grid-2" style={{ gap: '48px' }}>
                        <div>
                            <h3 style={{ marginBottom: '24px', fontWeight: 800 }}>{isLandlord ? 'Asset Intelligence' : 'Property Specifications'}</h3>
                            <div className="card" style={{ padding: '32px' }}>
                                <div className="grid grid-2" style={{ gap: '24px' }}>
                                    {[
                                        { label: 'Bedrooms', value: property.bedrooms },
                                        { label: 'Bathrooms', value: property.bathrooms },
                                        { label: 'Size', value: property.size || 'Unspecified' },
                                        { label: 'Created On', value: new Date(property.created_at).toLocaleDateString() }
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                                            <div style={{ fontWeight: 600 }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '32px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Security & Amenities</div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {(property.amenities || 'No listed amenities').split(',').map((a, i) => (
                                            <span key={i} style={{ padding: '4px 12px', background: 'var(--bg-secondary)', borderRadius: '2px', fontSize: '0.85rem' }}>{a.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginTop: '32px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Description</div>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{property.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ marginBottom: '24px', fontWeight: 800 }}>Media Repository</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                {images.length > 0 ? images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={`http://localhost:5000${img}`}
                                        alt={`Asset ${i}`}
                                        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                )) : (
                                    <div style={{ gridColumn: 'span 2', padding: '60px', background: 'var(--bg-secondary)', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                                        No media assets available for this property.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tenant' && (
                    <div className="card" style={{ padding: '48px', textAlign: property.active_lease ? 'left' : 'center' }}>
                        {property.active_lease ? (
                            <div>
                                <h3 style={{ marginBottom: '32px' }}>Active Tenant Details</h3>
                                <div className="grid grid-3">
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Entity Identifier</label>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>ID-{property.active_lease.tenant_id.substring(0, 8)}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Lease Expiry</label>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{new Date(property.active_lease.end_date).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Contract Status</label>
                                        <div><span className="badge badge-success">ENFORCED</span></div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '40px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>All future rent collections are automatically initiated based on the smart contract parameters defined in the original deposit lock.</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>No active tenant has been assigned to this asset.</p>
                                {isLandlord && (
                                    <button className="btn btn-dark btn-square" onClick={() => setIsDrafting(true)}>Draft Lease Agreement</button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ADDITIONAL TAB CONTENT BLOCKS... */}
            </div>

            {/* LEASE DRAFTING MODAL */}
            {isDrafting && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '500px', padding: '40px', position: 'relative' }}>
                        <button onClick={() => setIsDrafting(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                        <h2 style={{ marginBottom: '32px', fontWeight: 800 }}>Draft New Agreement</h2>

                        {!selectedTenant ? (
                            <form onSubmit={findTenant}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Identity Discovery</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="email"
                                        placeholder="Tenant Registered Email..."
                                        style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '0' }}
                                        value={searchEmail}
                                        onChange={e => setSearchEmail(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="btn btn-dark btn-square">Find</button>
                                </div>
                                <div style={{ marginTop: '24px' }}>
                                    {prospects.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedTenant(p)}
                                            style={{ padding: '16px', border: '1px solid var(--border)', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.email}</div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800 }}>SELECT &rarr;</span>
                                        </div>
                                    ))}
                                </div>
                            </form>
                        ) : (
                            <div className="fade-in">
                                <div style={{ padding: '16px', background: 'var(--bg-secondary)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>SELECTED TENANT</div>
                                        <div style={{ fontWeight: 700 }}>{selectedTenant.name}</div>
                                    </div>
                                    <button onClick={() => setSelectedTenant(null)} className="btn btn-link" style={{ fontSize: '0.8rem' }}>Change</button>
                                </div>

                                <div className="grid grid-2" style={{ gap: '24px', marginBottom: '32px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Start Date</label>
                                        <input type="date" value={leaseDates.start} onChange={e => setLeaseDates(prev => ({ ...prev, start: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid var(--border)' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>End Date</label>
                                        <input type="date" value={leaseDates.end} onChange={e => setLeaseDates(prev => ({ ...prev, end: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid var(--border)' }} />
                                    </div>
                                </div>

                                <button
                                    className="btn btn-dark btn-square"
                                    style={{ width: '100%' }}
                                    onClick={submitLease}
                                    disabled={submittingLease}
                                >
                                    {submittingLease ? 'Generating Smart Contract...' : 'Issue Lease Proposal'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
