import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { CardanoWallet } from "@meshsdk/react";

export default function Profile() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProfile()
            .then(data => setProfile(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading || !profile) return <div className="page container">Loading identity data...</div>;

    return (
        <div className="page container fade-in" style={{ maxWidth: '1000px' }}>
            <div className="page-header" style={{ marginBottom: '64px', borderBottom: '1px solid var(--border)', paddingBottom: '32px' }}>
                <span className="text-overline">Administration</span>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Reports & Settings</h1>
                <p>Manage your account credentials, wallet connectivity, and generate audit reports.</p>
            </div>

            <div className="grid grid-2" style={{ gap: '48px' }}>
                <div className="section">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>Profile Configuration</h3>
                    <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label>Identity Name</label>
                            <input className="input" defaultValue={profile.name} style={{ backgroundColor: 'var(--bg-secondary)' }} readOnly />
                        </div>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label>Email Address</label>
                            <input className="input" defaultValue={profile.email} style={{ backgroundColor: 'var(--bg-secondary)' }} readOnly />
                        </div>
                        <div className="form-group" style={{ marginBottom: 32 }}>
                            <label>Assigned Role</label>
                            <div style={{ padding: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                {profile.role}
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-square" onClick={logout} style={{ width: '100%', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                            Terminate Session (Logout)
                        </button>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>Financial Reporting</h3>
                    <div className="card" style={{ padding: '32px' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                            Download detailed audit logs of all escrow interactions and rental distributions.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn btn-dark btn-sm btn-square">Export Monthly Ledger (CSV)</button>
                            <button className="btn btn-secondary btn-sm btn-square">Tax Compliance Report (PDF)</button>
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>Gateway Identity</h3>
                    <div className="card" style={{ padding: '32px', borderTop: '4px solid var(--dark-slate)' }}>
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>Cardano Network Identity</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                {profile.wallet_address || 'Unlinked Wallet'}
                            </div>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center' }}>
                            Your browser-based wallet handles all smart contract authorizations.
                        </p>
                        <CardanoWallet />
                    </div>

                    <div className="card" style={{ marginTop: '32px', padding: '32px', backgroundColor: 'var(--bg-secondary)' }}>
                        <h4 style={{ fontWeight: 700, marginBottom: '12px' }}>System Preferences</h4>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem' }}>Email Notifications</span>
                            <input type="checkbox" defaultChecked />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                            <span style={{ fontSize: '0.9rem' }}>Auto-finalize Escrow</span>
                            <input type="checkbox" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
