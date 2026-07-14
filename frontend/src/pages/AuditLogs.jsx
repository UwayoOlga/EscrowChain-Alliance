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

    if (loading) return <div className="page container"><p>Loading system logs...</p></div>;

    const formatActionName = (action) => {
        if (!action) return '';
        return action
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="page container fade-in" style={{ padding: '16px 24px' }}>
            <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <span className="text-overline">Security</span>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--dark-slate)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    Event logs & Audits
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    A full history of verified user registrations, lease deployments, and smart contract activities.
                </p>
            </div>

            <div className="dash-card" style={{ padding: 0 }}>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Account Reference</th>
                                <th>Event Type</th>
                                <th>Asset Link</th>
                                <th style={{ textAlign: 'right' }}>Event Metadata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                        No event logs found for this session.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {log.user_id ? `${log.user_id.substring(0, 8).toUpperCase()}...` : 'SYSTEM'}
                                        </td>
                                        <td>
                                            <span className="badge badge-secondary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                                                {formatActionName(log.action)}
                                            </span>
                                        </td>
                                        <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {log.resource_id ? log.resource_id.substring(0, 8).toUpperCase() : 'SYSTEM'}
                                        </td>
                                        <td className="mono" style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
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
