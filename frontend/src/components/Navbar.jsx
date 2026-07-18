import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user } = useAuth();

    return (
        <nav className="navbar" style={{ height: '80px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
            <div className="container navbar-inner" style={{ height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '64px' }}>
                    <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, borderRadius: '2px' }}>E</div>
                        <span className="brand-text" style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--dark-slate)' }}>EscrowChain</span>
                    </Link>

                    <div className="navbar-menu" style={{ display: 'flex', gap: '32px' }}>
                        <Link to="/#explore" className="nav-item" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Capabilities</Link>
                        <Link to="/#security" className="nav-item" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Network Security</Link>
                        <Link to="/#solutions" className="nav-item" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Solutions</Link>
                    </div>
                </div>

                <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary btn-sm btn-square">Open Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sign In</Link>
                            <Link to="/register" className="btn btn-primary btn-sm btn-square" style={{ padding: '10px 24px' }}>Request Access</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
