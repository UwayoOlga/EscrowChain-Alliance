import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user } = useAuth();

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                    <Link to="/" className="navbar-brand">
                        <span className="brand-text">EscrowChain</span>
                    </Link>

                    <div className="navbar-menu">
                        <Link to="/" className="nav-item">Solutions</Link>
                        <Link to="/" className="nav-item">Industries</Link>
                        <Link to="/" className="nav-item">Insights</Link>
                        <Link to="/" className="nav-item">About</Link>
                    </div>
                </div>

                <div className="navbar-links">
                    <div className="language-dropdown">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            <path d="M2 12h20"></path>
                        </svg>
                        <select className="lang-select" defaultValue="EN">
                            <option value="EN">EN - English</option>
                            <option value="ZH">ZH - 中文</option>
                            <option value="HI">HI - हिन्दी</option>
                            <option value="ES">ES - Español</option>
                            <option value="FR">FR - Français</option>
                        </select>
                    </div>

                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary btn-sm btn-square">Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Client Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm btn-square">Contact Sales</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
