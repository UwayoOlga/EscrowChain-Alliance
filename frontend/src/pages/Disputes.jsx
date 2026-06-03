import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Disputes() {
    const { user } = useAuth();
    const [disputes, setDisputes] = useState([]);
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [selectedLease, setSelectedLease] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = () => {
        setLoading(true);
        Promise.all([api.getDisputes(), api.getLeases()])
            .then(([dData, lData]) => {
                setDisputes(Array.isArray(dData) ? dData : []);
                setLeases(Array.isArray(lData) ? lData : []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createDispute({
                leaseId: selectedLease,
                reason: reason
            });
            setIsCreating(false);
            setReason('');
            setSelectedLease('');
            loadData();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="page container"><p>Loading Resolution Center...</p></div>;

    return (
        <div className="page container fade-in" style={{ maxWidth: '900px' }}>
            <div className="page-header text-center" style={{ marginBottom: '64px' }}>
                <span className="text-overline">Mediation & Governance</span>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Dispute Resolution</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto' }}>
                    Securely report and manage conflicts regarding smart contract execution and physical asset conditions.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="card" style={{ padding: '40px', borderTop: '4px solid var(--dark-slate)', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Open a Dispute Case</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Please select an active lease agreement and provide a detailed reason for the mediation request.
                        </p>

                        {!isCreating ? (
                            <button className="btn btn-dark btn-lg btn-square" onClick={() => setIsCreating(true)}>Initiate Resolution +</button>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginTop: '32px' }} className="fade-in">
                                <div className="form-group">
                                    <label>Select Lease Contract</label>
                                    <select className="input" required value={selectedLease} onChange={(e) => setSelectedLease(e.target.value)}>
                                        <option value="" disabled>-- Select Active Lease --</option>
                                        {leases.map(l => (
                                            <option key={l.id} value={l.id}>
                                                Contract CT-{l.id.substring(0, 8).toUpperCase()} (RWF {l.rent_amount}/mo)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Reason for Dispute</label>
                                    <textarea
                                        className="input"
                                        rows="4"
                                        required
                                        placeholder="Describe the issue (e.g., unpaid rent, property damage)..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    ></textarea>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-secondary btn-square" onClick={() => setIsCreating(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-dark btn-square" disabled={submitting}>
                                        {submitting ? 'Submitting...' : 'Submit to Arbitration'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>Active Cases</h2>
                    {disputes.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed var(--border)' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>No active dispute cases on the ledger.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {disputes.map(d => (
                                <div key={d.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark-slate)' }}>CASE-{d.id.substring(0, 8).toUpperCase()}</span>
                                            <span className={`badge ${d.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>{d.status}</span>
                                        </div>
                                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{d.property_address}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{d.reason}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Opened: {new Date(d.created_at).toLocaleDateString()}</div>
                                        <button className="btn btn-secondary btn-sm btn-square">View Details</button>
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
