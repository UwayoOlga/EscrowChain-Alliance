import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Properties() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '', address: '', description: '', rentAmount: '', depositAmount: '',
        bedrooms: '', bathrooms: '', size: '', amenities: '', leaseTemplate: '', status: 'available'
    });
    const [selectedFiles, setSelectedFiles] = useState([]);

    const isLandlord = user?.role?.toLowerCase() === 'landlord';

    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = () => {
        api.getProperties()
            .then(data => setProperties(Array.isArray(data) ? data : []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            title: '', address: '', description: '', rentAmount: '', depositAmount: '',
            bedrooms: '', bathrooms: '', size: '', amenities: '', leaseTemplate: '', status: 'available'
        });
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEdit = (p) => {
        setFormData({
            title: p.title || '',
            address: p.address || '',
            description: p.description || '',
            rentAmount: p.rent_amount || '',
            depositAmount: p.deposit_amount || '',
            bedrooms: p.bedrooms || '',
            bathrooms: p.bathrooms || '',
            size: p.size || '',
            amenities: p.amenities || '',
            leaseTemplate: p.lease_template || '',
            status: p.status || 'available'
        });
        setEditingId(p.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this asset from the ledger? This action cannot be undone.')) return;
        try {
            await api.deleteProperty(id);
            loadProperties();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            selectedFiles.forEach(file => {
                data.append('images', file);
            });

            if (editingId) {
                // For updates, we might want to track existing images too, 
                // but for simplicity in this step, we just send new ones.
                // The backend handles merging if we pass existing ones, 
                // but let's just implement basic creation/update here.
                await api.updateProperty(editingId, data);
            } else {
                await api.createProperty(data);
            }

            resetForm();
            loadProperties();
        } catch (err) {
            alert(err.message);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            available: 'badge-success',
            occupied: 'badge-info',
            archived: 'badge-secondary',
            'pending approval': 'badge-warning',
            'under maintenance': 'badge-warning',
            'under dispute': 'badge-danger'
        };
        return <span className={`badge ${styles[status] || 'badge-secondary'}`}>{status}</span>;
    };

    if (loading) return <div className="page container">Loading Portfolio Engine...</div>;

    return (
        <div className="page-dashboard fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                <div>
                    <span className="text-overline">Asset Ledger</span>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>Properties Portfolio</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLandlord
                            ? 'Manage physical real estate assets and programmatic lease agreements.'
                            : 'Discover and inspect verified rental opportunities on the Cardano ledger.'}
                    </p>
                </div>
                {isLandlord ? (
                    <button className="btn btn-primary btn-square" onClick={() => showForm ? resetForm() : setShowForm(true)}>
                        {showForm ? 'Cancel Operation' : 'Register New Asset +'}
                    </button>
                ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Logged in as {user?.role || 'Guest'}
                    </div>
                )}
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '48px', padding: '40px', borderTop: `4px solid ${editingId ? 'var(--dark-slate)' : 'var(--accent)'}` }}>
                    <h3 style={{ marginBottom: '32px', fontWeight: 800 }}>{editingId ? 'Update Asset Metadata' : 'Asset Registration'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-2" style={{ gap: '24px' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Property Title / Reference</label>
                            <input type="text" className="input" placeholder="e.g. Skyline Apartments - Unit 402" required
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Physical Address</label>
                            <input type="text" className="input" placeholder="Full legal address" required
                                value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Monthly Rent (₳)</label>
                            <input type="number" className="input" required
                                value={formData.rentAmount} onChange={e => setFormData({ ...formData, rentAmount: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Security Deposit (₳)</label>
                            <input type="number" className="input" required
                                value={formData.depositAmount} onChange={e => setFormData({ ...formData, depositAmount: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Bedrooms</label>
                            <input type="number" className="input"
                                value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Bathrooms</label>
                            <input type="number" className="input"
                                value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Total Size (sqft/m2)</label>
                            <input type="text" className="input"
                                value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Amenities (Comma separated)</label>
                            <input type="text" className="input" placeholder="Pool, Gym, Parking..."
                                value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Lifecycle Status</label>
                            <select className="input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="available">Available</option>
                                <option value="occupied">Occupied (Auto-managed)</option>
                                <option value="under maintenance">Under Maintenance</option>
                                <option value="archived">Archived</option>
                                <option value="under dispute">Under Dispute</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Detailed Description</label>
                            <textarea className="input" rows="4"
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Property Images (Upload at least one)</label>
                            <input type="file" className="input" multiple accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                            {selectedFiles.length > 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '4px' }}>
                                    {selectedFiles.length} file(s) selected for upload.
                                </div>
                            )}
                        </div>
                        <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                            <button type="submit" className="btn btn-dark btn-lg btn-square" style={{ width: '100%' }}>
                                {editingId ? 'Commit Updates' : 'Finalize Registration'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Asset Details</th>
                                <th>Current Occupant</th>
                                <th>Financials (₳)</th>
                                <th>Lifecycle Status</th>
                                <th>Lease Expiry</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {properties.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {p.images && JSON.parse(p.images).length > 0 ? (
                                                <img
                                                    src={`http://localhost:5000${JSON.parse(p.images)[0]}`}
                                                    alt="Prop"
                                                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-muted)' }}>NO IMG</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{p.title || 'Untitled Asset'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {p.current_tenant ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                                    {p.current_tenant[0]}
                                                </div>
                                                {p.current_tenant}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vacant</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{p.rent_amount} / mo</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₳ {p.deposit_amount} Deposit</div>
                                    </td>
                                    <td>{getStatusBadge(p.status)}</td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {p.lease_expiry ? new Date(p.lease_expiry).toLocaleDateString() : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <Link to={`/properties/${p.id}`} className="btn btn-secondary btn-sm btn-square">
                                                {isLandlord ? 'Audit' : 'View Details'}
                                            </Link>
                                            {isLandlord && p.landlord_id === user.id && (
                                                <>
                                                    <button className="btn btn-dark btn-sm btn-square" onClick={() => handleEdit(p)}>Edit</button>
                                                    <button className="btn btn-danger btn-sm btn-square" onClick={() => handleDelete(p.id)} style={{ padding: '8px' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {properties.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                                        No registered assets found in the ledger.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
