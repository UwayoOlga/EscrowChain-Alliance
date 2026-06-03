import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('tenant');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(name, email, password, role);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: 420 }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Create account</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
                    Join EscrowChain as a landlord or tenant
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input className="input" type="text" placeholder="John Doe"
                            value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input className="input" type="email" placeholder="you@example.com"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input className="input" type="password" placeholder="Min 6 characters"
                            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div className="form-group">
                        <label>I am a</label>
                        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="tenant">Tenant</option>
                            <option value="landlord">Landlord</option>
                        </select>
                    </div>
                    <button className="btn btn-primary btn-lg" type="submit" style={{ marginTop: 8 }}>
                        Create Account
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
