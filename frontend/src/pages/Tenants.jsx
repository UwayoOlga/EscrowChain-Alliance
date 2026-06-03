import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Tenants() {
    const { user } = useAuth();
    const [tenants, setTenants] = useState([]);
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role !== 'landlord') return;

        Promise.all([
            api.getTenants(),
            api.getLeases()
        ]).then(([tenantList, leaseList]) => {
            setTenants(tenantList);
            setLeases(leaseList);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [user]);

    if (loading) return <div className="page container"><p>Loading Network Directory...</p></div>;

    return (
        <div className="page container fade-in">
            <div className="page-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '32px' }}>
                <span className="text-overline">Identity & Relations</span>
                <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>Tenant Management</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your relationships with verified residents and track their on-chain standing.</p>
            </div>

            <div className="grid grid-1" style={{ marginBottom: 48 }}>
                <div className="card stat-card" style={{ borderTop: '4px solid var(--success)' }}>
                    <div className="stat-value">{tenants.length}</div>
                    <div className="stat-label">Associated Tenants</div>
                </div>
            </div>

            <h2 style={{ marginBottom: 24, fontSize: '1.5rem', color: 'var(--dark-slate)' }}>My Tenants</h2>
            {tenants.length === 0 ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
                    <h3 style={{ marginBottom: '8px' }}>No Tenants Found</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                        You currently don't have any tenants linked to your properties through active or pending lease agreements.
                    </p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Legal Name</th>
                                    <th>Contact Information</th>
                                    <th>Wallet Identity</th>
                                    <th>Lifecycle Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                    {t.name[0]}
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{t.name}</div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{t.email}</td>
                                        <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                            {t.wallet_address ? `${t.wallet_address.substring(0, 12)}...` : 'Not Linked'}
                                        </td>
                                        <td><span className="badge badge-success">Verified</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn btn-secondary btn-sm btn-square">Audit History</button>
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
