import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Properties() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ address: '', rentAmount: '', depositAmount: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = () => {
        api.getProperties()
            .then(data => setProperties(Array.isArray(data) ? data : []))
            .catch(() => setProperties([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.createProperty({
                address: form.address,
                rentAmount: Number(form.rentAmount),
                depositAmount: Number(form.depositAmount),
            });
            setForm({ address: '', rentAmount: '', depositAmount: '' });
            setShowForm(false);
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const myProperties = user?.role === 'landlord' ? properties.filter(p => p.landlord_id === user.id) : properties;

    if (loading) return <div className="page container"><p>Loading...</p></div>;

    return (
        <div className="page container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '32px' }}>
                <div>
                    <span className="text-overline">Asset Management</span>
                    <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>Properties Portfolio</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Browse and manage your verified real estate assets on-chain.</p>
                </div>
                {user?.role === 'landlord' && (
                    <button className="btn btn-primary btn-square" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel Creation' : 'Register New Asset +'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card fade-in" style={{ marginBottom: 32, borderTop: '4px solid var(--accent)' }}>
                    <h3 style={{ marginBottom: 16, fontSize: '1.25rem' }}>Asset Registration Form</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>Asset data will be hashed and mapped to your identity.</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label>Physical Address</label>
                            <input className="input" placeholder="e.g., 100 Financial District, Unit 4B"
                                value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div className="form-group">
                                <label>Monthly Rent (Cardano ₳)</label>
                                <input className="input" type="number" placeholder="1500"
                                    value={form.rentAmount} onChange={e => setForm({ ...form, rentAmount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Required Deposit (Cardano ₳)</label>
                                <input className="input" type="number" placeholder="3000"
                                    value={form.depositAmount} onChange={e => setForm({ ...form, depositAmount: e.target.value })} required />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <button className="btn btn-dark btn-lg btn-square" type="submit">Submit Registration</button>
                        </div>
                    </form>
                </div>
            )}

            {myProperties.length === 0 ? (
                <div className="card empty-state" style={{ padding: '80px 20px', backgroundColor: 'var(--bg-secondary)' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Assets Registered</h3>
                    <p>You have not mapped any real estate assets to your account.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Asset Address</th>
                                    <th>Status</th>
                                    <th>Monthly Escrow (₳)</th>
                                    <th>Deposit Required (₳)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myProperties.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--dark-slate)' }}>{p.address}</td>
                                        <td>
                                            <span className={`badge ${p.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td>₳ {p.rent_amount}</td>
                                        <td>₳ {p.deposit_amount}</td>
                                        <td>
                                            <Link to="#" className="link-arrow dark" style={{ fontSize: '0.85rem' }}>View Ledger Data &rarr;</Link>
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
