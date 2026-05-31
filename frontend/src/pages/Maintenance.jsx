import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Maintenance() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    const loadData = () => {
        setLoading(true);
        Promise.all([api.getMaintenanceRequests(), api.getProperties()])
            .then(([mData, pData]) => {
                setRequests(Array.isArray(mData) ? mData : []);
                setProperties(Array.isArray(pData) ? pData : []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createMaintenanceRequest({
                propertyId: selectedProperty,
                title,
                description
            });
            setIsCreating(false);
            setTitle('');
            setDescription('');
            setSelectedProperty('');
            loadData();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await api.updateMaintenanceStatus(id, status);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const statusBadge = (status) => {
        const map = {
            pending: 'badge-warning',
            'in-progress': 'badge-info',
            resolved: 'badge-success',
            rejected: 'badge-danger'
        };
        return map[status] || 'badge-secondary';
    };

    if (loading) return <div className="page container"><p>Loading Maintenance Hub...</p></div>;

    return (
        <div className="page container fade-in" style={{ maxWidth: '960px' }}>
            <div className="page-header text-center" style={{ marginBottom: '64px' }}>
                <span className="text-overline">Facilities Support</span>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Maintenance Requests</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
                    {isLandlord
                        ? 'Review and manage tenant-submitted facility issues across your portfolio.'
                        : 'Submit and track physical appliance or facility issues for rapid resolution.'}
                </p>
            </div>

            {/* CREATE FORM */}
            {!isLandlord && (
                <div className="card" style={{ padding: '40px', borderTop: '4px solid var(--dark-slate)', backgroundColor: 'var(--bg-secondary)', marginBottom: '48px' }}>
                    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Report an Issue</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Select the property and describe the maintenance issue in detail.
                        </p>

                        {!isCreating ? (
                            <button className="btn btn-dark btn-lg btn-square" onClick={() => setIsCreating(true)}>File New Request +</button>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginTop: '32px' }} className="fade-in">
                                <div className="form-group">
                                    <label>Property</label>
                                    <select className="input" required value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}>
                                        <option value="" disabled>-- Select Property --</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.title || p.address}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Issue Title</label>
                                    <input
                                        type="text"
                                        className="input"
                                        required
                                        placeholder="e.g. Broken water heater in unit 3B"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Detailed Description</label>
                                    <textarea
                                        className="input"
                                        rows="4"
                                        required
                                        placeholder="Describe the issue, when it started, and urgency level..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    ></textarea>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-secondary btn-square" onClick={() => setIsCreating(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-dark btn-square" disabled={submitting}>
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* REQUESTS LIST */}
            <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>
                    {isLandlord ? 'Tenant Requests' : 'My Requests'}
                </h2>
                {requests.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed var(--border)' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No maintenance requests found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {requests.map(r => (
                            <div key={r.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark-slate)' }}>
                                            MR-{r.id.substring(0, 8).toUpperCase()}
                                        </span>
                                        <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                                    </div>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{r.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.property_address}</div>
                                    {r.description && (
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>{r.description}</p>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </div>
                                    {isLandlord && r.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-dark btn-sm btn-square" onClick={() => handleStatusChange(r.id, 'in-progress')}>Accept</button>
                                            <button className="btn btn-danger btn-sm btn-square" style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => handleStatusChange(r.id, 'rejected')}>Reject</button>
                                        </div>
                                    )}
                                    {isLandlord && r.status === 'in-progress' && (
                                        <button className="btn btn-secondary btn-sm btn-square" onClick={() => handleStatusChange(r.id, 'resolved')}>Mark Resolved</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
