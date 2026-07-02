import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CardanoWallet, useWallet } from '@meshsdk/react';
import { api } from '../api';
import { useEffect, useState, useRef } from 'react';
import './Topbar.css';

export default function Topbar() {
    const { user, logout } = useAuth();
    const { connected, wallet, address } = useWallet();
    const navigate = useNavigate();

    // Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef(null);

    // Alert States
    const [alerts, setAlerts] = useState([]);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const alertsRef = useRef(null);

    // Profile Dropdown States
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Sync Cardano Address to profile
    useEffect(() => {
        if (connected && address) {
            console.log('🔄 Syncing on-chain identity:', address);
            api.updateProfile({ walletAddress: address })
                .catch(err => console.error('Wallet sync failed:', err));
        }
    }, [connected, address]);

    // Fetch Alerts on Mount and Poll
    const fetchAlerts = () => {
        api.getAlerts()
            .then(data => setAlerts(Array.isArray(data) ? data : []))
            .catch(err => console.error('Alerts fetch failed:', err));
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000); // poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    // Global Search Change Handler
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(() => {
            api.globalSearch(searchQuery)
                .then(data => {
                    setSearchResults(Array.isArray(data) ? data : []);
                })
                .catch(err => console.error('Search query failed:', err));
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    // Click outside handlers to close dropdowns
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
            }
            if (alertsRef.current && !alertsRef.current.contains(e.target)) {
                setAlertsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleSearchItemClick = (link) => {
        setSearchQuery('');
        setSearchOpen(false);
        navigate(link);
    };

    const handleAlertClick = (link) => {
        setAlertsOpen(false);
        navigate(link);
    };

    return (
        <header className="topbar">
            {/* Search Section */}
            <div className="topbar-search-container" ref={searchRef}>
                <div className="topbar-search">
                    <svg className="search-icon" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Global search properties, leases, or ledger ID..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSearchOpen(true);
                        }}
                        onFocus={() => setSearchOpen(true)}
                    />
                </div>

                {searchOpen && searchResults.length > 0 && (
                    <div className="search-dropdown">
                        {searchResults.map((item) => (
                            <div
                                key={item.id}
                                className="search-dropdown-item"
                                onClick={() => handleSearchItemClick(item.link)}
                            >
                                <span className={`search-badge badge-${item.type}`}>
                                    {item.type.toUpperCase()}
                                </span>
                                <div className="search-item-info">
                                    <div className="search-item-title">{item.title}</div>
                                    <div className="search-item-subtitle">{item.subtitle}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions & Profiles */}
            <div className="topbar-actions">
                <div style={{ marginRight: '8px' }}>
                    <CardanoWallet label="Verify Identity" isDark={false} />
                </div>

                {/* Notification Bell Section */}
                <div className="topbar-alerts-container" ref={alertsRef}>
                    <div className="topbar-alerts" onClick={() => setAlertsOpen(!alertsOpen)}>
                        <svg className="action-icon" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {alerts.length > 0 && <span className="dot">{alerts.length}</span>}
                    </div>

                    {alertsOpen && (
                        <div className="alerts-dropdown">
                            <div className="alerts-dropdown-header">
                                <span>Recent Notifications</span>
                                <span className="alerts-count-badge">{alerts.length} New</span>
                            </div>
                            <div className="alerts-dropdown-list">
                                {alerts.length === 0 ? (
                                    <div className="alerts-empty-state">
                                        No new notifications or pending tasks.
                                    </div>
                                ) : (
                                    alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`alert-dropdown-item alert-type-${alert.type}`}
                                            onClick={() => handleAlertClick(alert.link)}
                                        >
                                            <div className="alert-item-indicator" />
                                            <div className="alert-item-message">{alert.message}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Section */}
                <div className="topbar-profile-container" ref={profileRef}>
                    <div className="user-profile-menu" onClick={() => setProfileOpen(!profileOpen)}>
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                        <div className="avatar-wrapper">
                            <div className="avatar">
                                {user?.name?.[0]}
                            </div>
                        </div>
                    </div>

                    {profileOpen && (
                        <div className="profile-dropdown">
                            <div className="profile-dropdown-header">
                                <div className="profile-avatar-large">{user?.name?.[0]}</div>
                                <div className="profile-details">
                                    <div className="profile-name-large">{user?.name}</div>
                                    <div className="profile-email-large">{user?.email}</div>
                                </div>
                            </div>
                            <div className="profile-dropdown-list">
                                <Link to="/profile" className="profile-dropdown-item" onClick={() => setProfileOpen(false)}>
                                    👤 Profile Settings
                                </Link>
                                <Link to="/profile" className="profile-dropdown-item" onClick={() => setProfileOpen(false)}>
                                    📊 Tax & Audit Ledger
                                </Link>
                                <div className="profile-dropdown-divider" />
                                <button className="profile-dropdown-item logout-btn" onClick={handleLogout}>
                                    🚪 Terminate Session (Logout)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
