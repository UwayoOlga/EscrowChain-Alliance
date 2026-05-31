import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { CardanoWallet } from "@meshsdk/react";

export default function Profile() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

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
                    <h1 style="margin:0; font-size: 24px;">EscrowChain Financial Ledger</h1>
                    <p style="margin: 5px 0 0; color: #475569;">${profile.role.toUpperCase()} Account: ${profile.name} (${profile.email})</p>
                    <p style="margin: 0; color: #475569;">Generated: ${new Date().toLocaleString()}</p>
                </div>
                <h3 style="margin-bottom: 16px;">Verified Cardano Smart Contract Events</h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #F1F5F9; color: #475569;">
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Date</th>
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Action</th>
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Asset</th>
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Amount (ADA)</th>
                            <th style="padding: 10px; border-bottom: 1px solid #CBD5E1;">Tx Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${confirmedTx.map(t => `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${new Date(t.created_at).toLocaleDateString()}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${t.action}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${t.property_address || t.lease_uid.substring(0, 8)}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold;">${t.amount}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${t.tx_hash ? t.tx_hash.substring(0, 16) + '...' : 'N/A'}</td>
                            </tr>
                        `).join('')}
                        ${confirmedTx.length === 0 ? '<tr><td colspan="5" style="padding:20px; text-align:center;">No verified transactions on ledger.</td></tr>' : ''}
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
                            <button
                                className="btn btn-secondary btn-sm btn-square"
                                onClick={generatePdfReport}
                                disabled={generating}
                            >
                                {generating ? 'Generating PDF...' : 'Tax Compliance Report (PDF)'}
                            </button>
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
