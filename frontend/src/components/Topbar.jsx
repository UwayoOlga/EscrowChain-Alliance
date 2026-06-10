import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CardanoWallet, useWallet } from '@meshsdk/react';
import { api } from '../api';
import { useEffect } from 'react';

export default function Topbar() {
    const { user, logout } = useAuth();
    const { connected, wallet, address } = useWallet();
    const navigate = useNavigate();

    useEffect(() => {
        if (connected && address) {
            console.log('🔄 Syncing on-chain identity:', address);
            api.updateProfile({ walletAddress: address })
                .catch(err => console.error('Wallet sync failed:', err));
        }
    }, [connected, address]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="topbar">
            <div className="topbar-search">
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Global search properties, tenants, or ledger ID..." />
            </div>

            <div className="topbar-actions">
                <div style={{ marginRight: '16px' }}>
                    {/* Customizing the CardanoWallet component via CSS later */}
                    <CardanoWallet label="Verify Identity" isDark={false} />
                </div>

                <div className="topbar-alerts">
                    <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="dot"></span>
                </div>

                <div className="user-profile-menu">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Sign out"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <div className="avatar" style={{ transition: 'opacity 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            {user?.name?.[0]}
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
}
