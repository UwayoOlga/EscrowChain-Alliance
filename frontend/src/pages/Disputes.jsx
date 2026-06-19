import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, BASE_URL } from '../api';

const STATUS_STYLES = {
    pending: { badge: 'badge-warning', label: 'OPEN' },
    arbitration: { badge: 'badge-info', label: 'ARBITRATION' },
    resolved: { badge: 'badge-success', label: 'RESOLVED' },
    dismissed: { badge: 'badge-secondary', label: 'DISMISSED' },
};

function EvidenceGrid({ paths }) {
    if (!paths || paths.length === 0) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {paths.map((p, i) => (
                <a key={i} href={`${BASE_URL}${p}`} target="_blank" rel="noreferrer">
                    {p.endsWith('.pdf') ? (
                        <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>
                            📄 PDF {i + 1}
                        </div>
                    ) : (
                        <img
                            src={`${BASE_URL}${p}`}
                            alt={`Evidence ${i + 1}`}
                            style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                    )}
                </a>
            ))}
        </div>
    );
}

export default function Disputes() {
    const { user } = useAuth();
    const isLandlord = user?.role?.toLowerCase() === 'landlord';
    const isArbitrator = user?.role?.toLowerCase() === 'arbitrator';

    const [disputes, setDisputes] = useState([]);
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [form, setForm] = useState({ leaseId: '', reason: '' });
    const fileInputRef = useRef(null);

    const loadData = () => {
        setLoading(true);
        Promise.all([api.getDisputes(), api.getLeases()])
            .then(([dData, lData]) => {
                setDisputes(Array.isArray(dData) ? dData : []);
                // Only show leases that are active or under dispute — prevents filing on pending ones
                const eligible = (Array.isArray(lData) ? lData : []).filter(
                    l => l.status === 'active' || l.status === 'under dispute'
                );
                setLeases(eligible);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const resetForm = () => {
        setIsCreating(false);
        setForm({ leaseId: '', reason: '' });
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.leaseId || !form.reason.trim()) {
            alert('Please select a lease and provide a reason.');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('leaseId', form.leaseId);
            formData.append('reason', form.reason);
            selectedFiles.forEach(file => formData.append('evidence', file));

            await api.createDispute(formData);
            resetForm();
            loadData();
        } catch (err) {
            alert('Submission failed: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.updateDisputeStatus(id, status);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="page container"><p>Loading Resolution Center...</p></div>;

    return (
        <div className="page-dashboard fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                <div>
                    <span className="text-overline">Mediation & Governance</span>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>Dispute Resolution Vault</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Report lease conflicts, upload photographic evidence and freeze escrow funds pending arbitration.
                    </p>
                </div>
                {!isCreating && (
                    <button className="btn btn-primary btn-square" onClick={() => setIsCreating(true)}>
                        Open Case +
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="card" style={{ padding: '40px', marginBottom: '48px', borderTop: '4px solid var(--accent)' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '8px' }}>File a Dispute Case</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
                        Submitting this form will immediately freeze the lease's escrow balance until the case is resolved.
                    </p>

                    {leases.length === 0 ? (
                        <div style={{ padding: '32px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            You have no active leases eligible for dispute.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid grid-2" style={{ gap: '24px' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Select Lease Contract</label>
                                <select className="input" required value={form.leaseId} onChange={e => setForm({ ...form, leaseId: e.target.value })}>
                                    <option value="" disabled>-- Select Active Lease --</option>
                                    {leases.map(l => (
                                        <option key={l.id} value={l.id}>
                                            CT-{l.id.substring(0, 8).toUpperCase()} · RWF {l.rent_amount}/mo
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Detailed Reason for Dispute</label>
                                <textarea
                                    className="input"
                                    rows="5"
                                    required
                                    placeholder="Describe the conflict clearly (e.g., landlord withheld deposit, property damage not disclosed, unpaid rent)..."
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Evidence Files (Photos or PDF, up to 5 files)</label>
                                <input
                                    type="file"
                                    className="input"
                                    multiple
                                    accept="image/*,application/pdf"
                                    ref={fileInputRef}
                                    onChange={e => setSelectedFiles(Array.from(e.target.files))}
                                />
                                {selectedFiles.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '6px' }}>
                                        {selectedFiles.length} file(s) selected.
                                    </div>
                                )}
                            </div>

                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary btn-square" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="btn btn-dark btn-lg btn-square" disabled={submitting}>
                                    {submitting ? 'Submitting to Arbitration...' : 'Submit Dispute Case'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    Active Cases — {disputes.length}
                </h2>

                {disputes.length === 0 ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No active dispute cases on the ledger.</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All smart contracts are operating within normal parameters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {disputes.map(d => {
                            const statusStyle = STATUS_STYLES[d.status] || STATUS_STYLES.pending;
                            let evidence = [];
                            try { evidence = JSON.parse(d.evidence || '[]'); } catch { evidence = []; }

                            return (
                                <div key={d.id} className="card" style={{ padding: '32px', borderLeft: d.status === 'pending' ? '4px solid var(--accent)' : '4px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--dark-slate)' }}>
                                                    CASE-{d.id.substring(0, 8).toUpperCase()}
                                                </span>
                                                <span className={`badge ${statusStyle.badge}`}>{statusStyle.label}</span>
                                            </div>
                                            <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                                                {d.property_title || d.property_address}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                                Raised by <strong>{d.raised_by_name}</strong> · {new Date(d.created_at).toLocaleDateString('en-RW', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: '600px' }}>
                                                {d.reason}
                                            </p>
                                            <EvidenceGrid paths={evidence} />
                                        </div>

                                        {/* ── Landlord Resolution Actions ── */}
                                        {isLandlord && d.status === 'pending' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                                                <button
                                                    className="btn btn-dark btn-sm btn-square"
                                                    onClick={() => handleStatusUpdate(d.id, 'arbitration')}
                                                >
                                                    Escalate to Arbitration
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm btn-square"
                                                    onClick={() => handleStatusUpdate(d.id, 'resolved')}
                                                >
                                                    Mark as Resolved
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm btn-square"
                                                    style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                                                    onClick={() => handleStatusUpdate(d.id, 'dismissed')}
                                                >
                                                    Dismiss Case
                                                </button>
                                            </div>
                                        )}

                                        {/* ── Arbitrator Resolution Actions ── */}
                                        {isArbitrator && (d.status === 'pending' || d.status === 'arbitration') && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                                                <button
                                                    className="btn btn-dark btn-sm btn-square"
                                                    onClick={() => handleStatusUpdate(d.id, 'resolved')}
                                                >
                                                    Favor Tenant (Refund Escrow)
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm btn-square"
                                                    onClick={() => handleStatusUpdate(d.id, 'dismissed')}
                                                >
                                                    Favor Landlord (Release Escrow)
                                                </button>
                                            </div>
                                        )}

                                        {!isLandlord && !isArbitrator && d.status === 'pending' && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>
                                                Awaiting landlord review
                                            </div>
                                        )}
                                        {!isLandlord && !isArbitrator && d.status === 'arbitration' && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>
                                                Under review by Legal Arbitration
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
