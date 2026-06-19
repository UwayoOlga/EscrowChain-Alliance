import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, BASE_URL } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PropertyDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const [property, setProperty] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const [isDrafting, setIsDrafting] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [prospects, setProspects] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [leaseDates, setLeaseDates] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });
    const [applicationNote, setApplicationNote] = useState('');
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
        // Exception validation: Ensure dates are submitted if landlord drafted, or auto-generate for tenant
        const finalTenantId = isLandlord ? selectedTenant?.id : user.id;
        const finalStart = isLandlord ? leaseDates.start : new Date().toISOString().split('T')[0];
        const finalEnd = isLandlord ? leaseDates.end : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

        if (!finalTenantId) {
            alert('A valid tenant entity is required.');
            return;
        }

        setSubmittingLease(true);
        try {
            await api.createLease({
                propertyId: property.id,
                tenantId: finalTenantId,
                startDate: finalStart,
                endDate: finalEnd,
                note: applicationNote || 'Interested in this property.'
            });
            alert('Application submitted! The landlord has been notified via email.');
            window.location.assign('/dashboard');
        } catch (err) {
            alert('Transaction failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmittingLease(false);
        }
    };

    useEffect(() => {
        const fetchAssetIntelligence = async () => {
            try {
                setLoading(true);
                setError(null);

                const propData = await api.getProperty(id);
                if (!propData) throw new Error('Asset ID not found in ledger.');
                setProperty(propData);

                // Dynamically resolve on-chain history if lease exists
                if (propData.active_lease?.id) {
                    const txHistory = await api.getEscrowByLease(propData.active_lease.id);
                    setTransactions(Array.isArray(txHistory) ? txHistory : []);
                }
            } catch (err) {
                console.error('Data acquisition failed:', err);
                setError(err.message || 'Failed to sync with local intelligence node.');
            } finally {
                setLoading(false);
            }
        };

        fetchAssetIntelligence();
    }, [id]);

    if (loading) return <div className="page container">Decrypting Asset Metadata...</div>;
    if (error) return <div className="page container" style={{ color: 'var(--danger)' }}>Error: {error}</div>;
    if (!property) return <div className="page container">Asset could not be validated.</div>;

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
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-slate)' }}>RWF {property.rent_amount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Monthly Contract Value</div>

                    {user?.role?.toLowerCase() === 'tenant' && property.status === 'available' && !isDrafting && (
                        <button
                            className="btn btn-dark btn-lg btn-square"
                            style={{ width: '100%', fontSize: '0.9rem' }}
                            onClick={() => setIsDrafting(true)}
                        >
                            Start Application
                        </button>
                    )}
                </div>
            </div>

            {/* TENANT APPLICATION FORM OVERLAY */}
            {isDrafting && user?.role?.toLowerCase() === 'tenant' && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent)', padding: '32px', borderRadius: '8px', marginBottom: '40px' }} className="fade-in">
                    <h3 style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                        Application Request
                        <button onClick={() => setIsDrafting(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                    </h3>
                    <div className="grid grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>DESIRED START DATE</label>
                            <input
                                type="date"
                                className="input"
                                value={leaseDates.start}
                                onChange={e => setLeaseDates(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>DESIRED END DATE</label>
                            <input
                                type="date"
                                className="input"
                                value={leaseDates.end}
                                onChange={e => setLeaseDates(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>NOTE TO LANDLORD (Optional)</label>
                        <textarea
                            className="input"
                            rows="3"
                            placeholder="Introduce yourself and mention why you are interested..."
                            value={applicationNote}
                            onChange={e => setApplicationNote(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-accent btn-square"
                        style={{ width: '100%', padding: '16px' }}
                        onClick={submitLease}
                        disabled={submittingLease}
                    >
                        {submittingLease ? 'Sending Application...' : 'Confirm & Submit Application'}
                    </button>
                    <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        By submitting, you agree to secure the deposit on-chain once the landlord approves.
                    </p>
                </div>
            )}

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
                                        src={`${BASE_URL}${img}`}
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
                                {property.status !== 'available' ? (
                                    <div style={{ color: 'var(--text-muted)', marginBottom: '24px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                        This physical asset is currently <strong>{property.status.toUpperCase()}</strong>. Exception locks prevent overlapping tenant assignments.
                                    </div>
                                ) : (
                                    <>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>No active tenant has been assigned to this asset.</p>

                                        {isLandlord ? (
                                            <button className="btn btn-dark btn-square" onClick={() => setIsDrafting(true)}>Draft Lease Agreement</button>
                                        ) : user?.role?.toLowerCase() === 'tenant' ? (
                                            <p style={{ color: 'var(--text-secondary)' }}>Click the "Rent this Property" button in the upper header to request this property.</p>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="card" style={{ padding: '48px', textAlign: 'left' }}>
                        <h3 style={{ marginBottom: '32px', fontWeight: 800 }}>Payment Ledger</h3>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Action Type</th>
                                        <th>Amount (RWF)</th>
                                        <th>Status</th>
                                        <th>Tx Hash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                                No financial transactions recorded for this asset yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map(tx => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                                                <td style={{ fontWeight: 500 }}>{tx.action}</td>
                                                <td style={{ fontWeight: 700 }}>RWF {tx.amount}</td>
                                                <td>
                                                    <span className={`badge ${tx.status === 'confirmed' ? 'badge-success' : 'badge-secondary'}`}>
                                                        {tx.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                    {tx.tx_hash ? tx.tx_hash.substring(0, 16) + '...' : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="grid grid-2" style={{ gap: '24px' }}>
                        <div className="card" style={{ padding: '32px' }}>
                            <h3 style={{ marginBottom: '16px', fontWeight: 800 }}>Central Compliance Vault</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Access your central Document Hub to view uploaded physical leases, compliance records, and programmatic audit trails for this asset.</p>
                            <Link to="/documents" className="btn btn-dark btn-square" style={{ textDecoration: 'none', display: 'inline-block' }}>Open Document Hub</Link>
                        </div>
                    </div>
                )}

                {activeTab === 'escrow' && (
                    <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <h3 style={{ marginBottom: '16px', fontWeight: 800 }}>Escrow Smart Contract State</h3>
                        <p style={{ margin: '0 auto 32px auto', maxWidth: '500px', color: 'var(--text-secondary)' }}>
                            Funds are secured programmatically on the Cardano blockchain. Neither party can withdraw the deposit without mutual on-chain consensus.
                        </p>

                        <div className="grid grid-3" style={{ gap: '24px', textAlign: 'left', marginBottom: '32px' }}>
                            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>LOCKED DEPOSIT</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>RWF {property.deposit_amount}</div>
                            </div>
                            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>CONTRACT ADDRESS</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                    {property.active_lease ? 'MAPPED TO PLUTUS V2 CBOR' : 'AWAITING LEASE'}
                                </div>
                            </div>
                            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>CONSENSUS STATUS</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>AWAITING MATURITY</div>
                            </div>
                        </div>

                        {isLandlord && property.active_lease && (
                            <button className="btn btn-dark btn-square" style={{ marginRight: '12px' }}>Initiate Return</button>
                        )}
                        {isLandlord && property.active_lease && (
                            <button className="btn btn-danger btn-square">File Dispute</button>
                        )}
                    </div>
                )}
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
