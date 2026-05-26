import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

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
        <div className="page container fade-in">
            <div className="page-header" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <span className="text-overline">Identity Context</span>
                <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>User Context & Wallet</h1>
                <p>Manage your enterprise credentials and native Cardano wallet connections.</p>
            </div>

            <div className="grid grid-2">
                <div className="card" style={{ borderTop: '4px solid var(--dark-slate)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: '1.25rem' }}>Identity Profile</h3>
                        <span className="badge badge-info">{profile.role.toUpperCase()}</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Full Name</label>
                        <div className="input" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{profile.name}</div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Email Address</label>
                        <div className="input" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{profile.email}</div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 24 }}>
                        <label>Internal Identity Hash (ID)</label>
                        <div className="input" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            ESCROW-ID-{String(profile.id).padStart(6, '0')}
                        </div>
                    </div>

                    <button className="btn btn-secondary btn-square" onClick={logout} style={{ width: '100%' }}>
                        Disconnect Session
                    </button>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--accent)' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Web3 Gateway Status</h3>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', border: '1px dashed var(--border-hover)' }}>
                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', backgroundColor: '#eff6ff', color: 'var(--accent)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12a10 10 0 1 0-10 10 10 10 0 0 0 10-10M12 2v20M2 12h20M12 12a10 10 0 0 0 10-10M12 12A10 10 0 0 1 2 22" />
                            </svg>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem', marginBottom: 24, maxWidth: 300 }}>
                            A Cardano Web3 Wallet is required to sign transactions and verify escrow transfers.
                        </p>
                        <button className="btn btn-primary btn-lg btn-square">
                            Connect Institutional Wallet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
