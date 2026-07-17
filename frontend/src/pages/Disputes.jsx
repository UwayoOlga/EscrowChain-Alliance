import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, BASE_URL } from '../api';
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';
import { awaitTxConfirmation } from '../utils/escrow';

const STATUS_STYLES = {
    pending: { badge: 'badge-warning', label: 'OPEN' },
    arbitration: { badge: 'badge-info', label: 'ARBITRATION' },
    resolved: { badge: 'badge-success', label: 'RESOLVED' },
    dismissed: { badge: 'badge-secondary', label: 'DISMISSED' },
};

function EvidenceGrid({ paths }) {
    if (!paths || paths.length === 0) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
            {paths.map((p, i) => (
                <a key={i} href={`${BASE_URL}${p}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    {p.endsWith('.pdf') ? (
                        <div style={{ 
                            padding: '10px 16px', 
                            background: 'var(--bg-secondary)', 
                            borderRadius: '8px', 
                            fontSize: '0.8rem', 
                            fontWeight: 700, 
                            color: 'var(--accent)',
                            border: '1px solid var(--border)'
                        }}>
                            📄 Attachment PDF {i + 1}
                        </div>
                    ) : (
                        <img
                            src={`${BASE_URL}${p}`}
                            alt={`Evidence ${i + 1}`}
                            style={{ 
                                width: '80px', 
                                height: '80px', 
                                objectFit: 'cover', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)',
                                boxShadow: 'none'
                            }}
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

    const { connected, wallet } = useWallet();
    const [resolvingId, setResolvingId] = useState(null);

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

    const handleArbitratorResolve = async (dispute, favorTenant) => {
        if (!connected) {
            alert('Arbitrator must connect wallet to resolve on-chain.');
            return;
        }

        const totalAmount = dispute.rent_amount + dispute.deposit_amount;
        const targetAddress = favorTenant ? dispute.tenant_wallet : dispute.landlord_wallet;

        if (!targetAddress) {
            alert('Cannot resolve: target party has not linked their wallet address.');
            return;
        }

        setResolvingId(dispute.id);
        try {
            // Send funds from Arbitrator wallet to the winner
            const tx = new Transaction({ initiator: wallet })
                .sendLovelace(
                    targetAddress,
                    (totalAmount * 1000000).toString()
                );

            const unsignedTx = await tx.build();
            const signedTx = await wallet.signTx(unsignedTx);
            const txHash = await wallet.submitTx(signedTx);

            alert(`Transaction submitted! Hash: ${txHash}. Waiting for confirmation...`);

            await awaitTxConfirmation(txHash);

            // Update database status
            await api.updateDisputeStatus(dispute.id, favorTenant ? 'resolved' : 'dismissed');
            alert('Dispute fully resolved and funds transferred.');
            loadData();
        } catch (err) {
            console.error(err);
            alert('Resolution failed: ' + err.message);
        } finally {
            setResolvingId(null);
        }
    };

    if (loading) return <div className="page container"><p>Loading conflict reports...</p></div>;

    return (
        <div className="page container fade-in" style={{ padding: '16px 24px' }}>
            {/* Header description */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <span className="text-overline">Mediation</span>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--dark-slate)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                        Disputes & Arbitration
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Report rental issues, attach photo evidence, and manage escrow freezes.
                    </p>
                </div>
                {!isCreating && (
                    <button className="btn btn-primary" style={{ borderRadius: '8px' }} onClick={() => setIsCreating(true)}>
                        Create New Case
                    </button>
                )}
            </div>

            {/* Create Case Block */}
            {isCreating && (
                <div className="dash-card" style={{ marginBottom: '40px' }}>
                    <div className="dash-card-header">
                        <h3>Report Rental Conflict</h3>
                    </div>
                    <div className="dash-card-body">
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Filing a dispute case will temporarily lock all active escrow balances associated with the lease contract until an agreement is reached or arbitrated.
                        </p>

                        {leases.length === 0 ? (
                            <div style={{ padding: '32px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
                                No active lease agreements are currently eligible for dispute resolution.
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Select Lease Agreement</label>
                                    <select className="select" required value={form.leaseId} onChange={e => setForm({ ...form, leaseId: e.target.value })} style={{ borderRadius: '8px' }}>
                                        <option value="" disabled>-- Select Lease Reference --</option>
                                        {leases.map(l => (
                                            <option key={l.id} value={l.id}>
                                                CT-{l.id.substring(0, 8).toUpperCase()} · RWF {l.rent_amount.toLocaleString()}/month
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Describe the Issue</label>
                                    <textarea
                                        className="input"
                                        rows="5"
                                        required
                                        placeholder="Provide a detailed explanation of the issue (e.g. key retrieval failed, property maintenance neglected, rent discrepancy)..."
                                        value={form.reason}
                                        onChange={e => setForm({ ...form, reason: e.target.value })}
                                        style={{ borderRadius: '8px', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Evidence Attachments (Images or PDFs)</label>
                                    <input
                                        type="file"
                                        className="input"
                                        multiple
                                        accept="image/*,application/pdf"
                                        ref={fileInputRef}
                                        onChange={e => setSelectedFiles(Array.from(e.target.files))}
                                        style={{ padding: '10px', fontSize: '0.85rem', borderRadius: '8px' }}
                                    />
                                    {selectedFiles.length > 0 && (
                                        <div style={{ fontSize: '0.82rem', color: 'var(--accent)', marginTop: '6px', fontWeight: 600 }}>
                                            {selectedFiles.length} file(s) ready to upload.
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                    <button type="button" className="btn btn-secondary" style={{ borderRadius: '8px' }} onClick={resetForm}>Cancel</button>
                                    <button type="submit" className="btn btn-dark" style={{ borderRadius: '8px' }} disabled={submitting}>
                                        {submitting ? 'Submitting case...' : 'Submit Case'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Active disputes lists */}
            <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>
                    Active Mediation Cases ({disputes.length})
                </h2>

                {disputes.length === 0 ? (
                    <div className="dash-card" style={{ padding: '60px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        </svg>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', fontWeight: 700 }}>No Disputes Filed</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>All active contracts are running smoothly without active conflicts.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {disputes.map(d => {
                            const statusStyle = STATUS_STYLES[d.status] || STATUS_STYLES.pending;
                            let evidence = [];
                            try { evidence = JSON.parse(d.evidence || '[]'); } catch { evidence = []; }

                            return (
                                <div key={d.id} className="dash-card" style={{ borderLeft: d.status === 'pending' ? '4px solid var(--accent)' : '4px solid var(--border)' }}>
                                    <div className="dash-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                                        <div style={{ flex: 1, minWidth: '240px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                                <span className="mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--dark-slate)' }}>
                                                    CASE-{d.id.substring(0, 8).toUpperCase()}
                                                </span>
                                                <span className={`badge ${statusStyle.badge}`} style={{ fontWeight: 700 }}>{statusStyle.label}</span>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--dark-slate)', marginBottom: '4px' }}>
                                                {d.property_title || d.property_address}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: 500 }}>
                                                Filed by <strong>{d.raised_by_name}</strong> on {new Date(d.created_at).toLocaleDateString()}
                                            </div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', maxWidth: '640px', margin: 0 }}>
                                                {d.reason}
                                            </p>
                                            <EvidenceGrid paths={evidence} />
                                        </div>

                                        {/* Landlord Action controls */}
                                        {isLandlord && d.status === 'pending' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px', flexShrink: 0 }}>
                                                <button
                                                    className="btn btn-dark btn-sm"
                                                    style={{ borderRadius: '6px' }}
                                                    onClick={() => handleStatusUpdate(d.id, 'arbitration')}
                                                >
                                                    Escalate to Arbitration
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ borderRadius: '6px' }}
                                                    onClick={() => handleStatusUpdate(d.id, 'resolved')}
                                                >
                                                    Mark as Resolved
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '6px' }}
                                                    onClick={() => handleStatusUpdate(d.id, 'dismissed')}
                                                >
                                                    Dismiss Case
                                                </button>
                                            </div>
                                        )}

                                        {/* Arbitrator Actions */}
                                        {isArbitrator && (d.status === 'pending' || d.status === 'arbitration') && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px', flexShrink: 0 }}>
                                                <button
                                                    className="btn btn-dark btn-sm"
                                                    style={{ borderRadius: '6px' }}
                                                    onClick={() => handleArbitratorResolve(d, true)}
                                                    disabled={resolvingId === d.id}
                                                >
                                                    {resolvingId === d.id ? 'Processing...' : 'Favor Tenant (Refund)'}
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ borderRadius: '6px' }}
                                                    onClick={() => handleArbitratorResolve(d, false)}
                                                    disabled={resolvingId === d.id}
                                                >
                                                    {resolvingId === d.id ? 'Processing...' : 'Favor Landlord (Release)'}
                                                </button>
                                            </div>
                                        )}

                                        {!isLandlord && !isArbitrator && d.status === 'pending' && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center', fontWeight: 600 }}>
                                                Awaiting review by landlord
                                            </div>
                                        )}
                                        {!isLandlord && !isArbitrator && d.status === 'arbitration' && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center', fontWeight: 600 }}>
                                                Under legal arbitration review
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
