import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAuditLogs()
            .then(data => setLogs(Array.isArray(data) ? data : []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page container">Loading Audit Ledger...</div>;

    return (
        <div className="page container fade-in">
            <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '32px' }}>
                <span className="text-overline">Security & Compliance</span>
                <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>Global Audit Ledger</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Immutable history of all system events and cryptographic authorizations.</p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User Index</th>
                                <th>Operational Action</th>
                                <th>Target Asset</th>
                                <th style={{ textAlign: 'right' }}>Identity Hash (Metadata)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        No audit entries recorded in this session.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.user_id.substring(0, 13)}...</td>
                                        <td>
                                            <span className="badge badge-secondary" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                                {log.action.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {log.resource_id ? log.resource_id.substring(0, 8) : 'SYSTEM'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {log.metadata || '{}'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
