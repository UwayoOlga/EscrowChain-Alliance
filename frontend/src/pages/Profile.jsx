import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { CardanoWallet } from "@meshsdk/react";

export default function Profile() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [manualWallet, setManualWallet] = useState('');
    const [savingWallet, setSavingWallet] = useState(false);

    const handleSaveWallet = async () => {
        if (!manualWallet.trim()) return alert('Please paste a valid wallet address.');
        setSavingWallet(true);
        try {
            const updated = await api.updateProfile({ walletAddress: manualWallet.trim() });
            setProfile(prev => ({ ...prev, wallet_address: updated.wallet_address || manualWallet.trim() }));
            setManualWallet('');
            alert('Wallet address saved successfully!');
        } catch (err) {
            alert('Failed to save wallet: ' + err.message);
        } finally {
            setSavingWallet(false);
        }
    };

    const generatePdfReport = async () => {
        try {
            setGenerating(true);
            const txData = await api.getTransactions();
            const confirmedTx = (Array.isArray(txData) ? txData : []).filter(t => t.status === 'confirmed');

            const content = document.createElement('div');
            content.style.padding = '40px';
            content.style.fontFamily = '"Plus Jakarta Sans", sans-serif';
            content.style.color = '#1E293B';
            content.innerHTML = `
                <div style="border-bottom: 2px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="margin:0; font-size: 24px;">EscrowChain Ledger Report</h1>
                    <p style="margin: 5px 0 0; color: #475569; font-weight: 600;">${profile.role.toUpperCase()} Account: ${profile.name} (${profile.email})</p>
                    <p style="margin: 0; color: #64748b;">Generated: ${new Date().toLocaleString()}</p>
                </div>
                <h3 style="margin-bottom: 16px; font-weight: 700;">Verified Smart Contract Events</h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #F1F5F9; color: #475569;">
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Date</th>
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Action</th>
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Asset / Reference</th>
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Amount (RWF)</th>
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Tx Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${confirmedTx.map(t => {
                            const ref = t.property_address || (t.lease_id ? t.lease_id.substring(0, 8) : 'N/A');
                            return `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${new Date(t.created_at).toLocaleDateString()}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${t.action}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${ref}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold;">RWF ${t.amount.toLocaleString()}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${t.tx_hash ? t.tx_hash.substring(0, 16) + '...' : 'N/A'}</td>
                            </tr>
                            `;
                        }).join('')}
                        ${confirmedTx.length === 0 ? '<tr><td colspan="5" style="padding:20px; text-align:center; color: #94a3b8;">No verified transactions on ledger.</td></tr>' : ''}
                    </tbody>
                </table>
                <div style="margin-top: 40px; font-size: 10px; color: #94A3B8; text-align: center;">
                    <p>Cryptographically verified via EscrowChain Alliance Protocol</p>
                    <p>Cardano Identifier: ${profile.wallet_address || 'Not Linked'}</p>
                </div>
            `;

            const opt = {
                margin: 1,
                filename: `EscrowChain_Ledger_${profile.name.replace(' ', '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            await window.html2pdf().set(opt).from(content).save();
        } catch (err) {
            alert('Failed to generate report: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        api.getProfile()
            .then(data => setProfile(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading || !profile) return <div className="page container"><p>Loading profile details...</p></div>;

    return (
        <div className="page container fade-in" style={{ maxWidth: '1000px', padding: '16px 24px' }}>
            <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <span className="text-overline">Account</span>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--dark-slate)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    Settings & Reports
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details, connected wallets, and compliance reports.</p>
            </div>

            <div className="grid grid-2" style={{ gap: '32px' }}>
                {/* Left Column: Profile Info & PDF Reporting */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3>Personal Information</h3>
                        </div>
                        <div className="dash-card-body">
                            <div className="form-group" style={{ marginBottom: 20 }}>
                                <label>Full Name</label>
                                <input className="input" defaultValue={profile.name} style={{ backgroundColor: 'var(--bg-secondary)', border: 'none', fontWeight: 500 }} readOnly />
                            </div>
                            <div className="form-group" style={{ marginBottom: 20 }}>
                                <label>Email Address</label>
                                <input className="input" defaultValue={profile.email} style={{ backgroundColor: 'var(--bg-secondary)', border: 'none', fontWeight: 500 }} readOnly />
                            </div>
                            <div className="form-group" style={{ marginBottom: 32 }}>
                                <label>Account Role</label>
                                <div style={{ 
                                    padding: '12px 14px', 
                                    borderRadius: 'var(--radius-sm)', 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    fontWeight: 700, 
                                    fontSize: '0.85rem', 
                                    textTransform: 'uppercase',
                                    color: 'var(--dark-slate)'
                                }}>
                                    {profile.role}
                                </div>
                            </div>
                            <button className="btn btn-secondary" onClick={logout} style={{ width: '100%', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '8px' }}>
                                Sign Out of Session
                            </button>
                        </div>
                    </div>

                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3>Ledger Reporting</h3>
                        </div>
                        <div className="dash-card-body">
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                Download verified transaction logs of all rent deposits, contract payouts, and escrow allocations.
                            </p>
                            <button
                                className="btn btn-dark"
                                onClick={generatePdfReport}
                                disabled={generating}
                                style={{ width: '100%', borderRadius: '8px' }}
                            >
                                {generating ? 'Generating PDF...' : 'Download Financial PDF Ledger'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Wallet & Preferences */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div className="dash-card" style={{ borderTop: '4px solid var(--accent)' }}>
                        <div className="dash-card-header">
                            <h3>Cardano Wallet Integration</h3>
                        </div>
                        <div className="dash-card-body">
                            {profile.wallet_address ? (
                                <div style={{ 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    padding: '16px', 
                                    borderRadius: '8px', 
                                    textAlign: 'center', 
                                    marginBottom: '24px',
                                    border: '1px dashed var(--border-hover)'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                        CONNECTED CARDANO ADDRESS
                                    </div>
                                    <div className="mono" style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--dark-slate)', fontWeight: 600 }}>
                                        {profile.wallet_address}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ 
                                    backgroundColor: 'var(--warning-bg)', 
                                    padding: '16px', 
                                    borderRadius: '8px', 
                                    textAlign: 'center', 
                                    marginBottom: '24px',
                                    color: 'var(--warning)',
                                    fontWeight: 600,
                                    fontSize: '0.88rem'
                                }}>
                                    No wallet connected. Link your browser wallet below.
                                </div>
                            )}

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                                Link your Web3 browser wallet (e.g. Nami, Eternl, Vespr) to automatically verify and sign transactions.
                            </p>
                            
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                <CardanoWallet />
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>
                                    Manual Address Override
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        className="input"
                                        placeholder="addr_test1..."
                                        value={manualWallet}
                                        onChange={e => setManualWallet(e.target.value)}
                                        style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.82rem', borderRadius: '8px' }}
                                    />
                                    <button
                                        className="btn btn-dark"
                                        onClick={handleSaveWallet}
                                        disabled={savingWallet}
                                        style={{ whiteSpace: 'nowrap', borderRadius: '8px' }}
                                    >
                                        {savingWallet ? 'Saving...' : 'Link'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3>System Preferences</h3>
                        </div>
                        <div className="dash-card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Send transactional emails</span>
                                    <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Auto-sign lease deployments</span>
                                    <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
