import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, BASE_URL } from '../api';

const Icon = ({ d, size = 18, color = 'currentColor', strokeWidth = 1.75 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const ICONS = {
    bed: 'M3 7v11m0-7h18m0 0v7m0-7a2 2 0 00-2-2H9a2 2 0 00-2 2',
    bath: 'M4 12h16M4 12a2 2 0 01-2-2V8a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 01-2 2M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
    key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2'
};

const FILTERS = ['All', 'Available', 'Verified'];

function PropertyCard({ p, onAction }) {
    const coverImage = p.primary_image ? `${BASE_URL}${p.primary_image}` : null;
    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
        }}
            onClick={() => onAction(p)}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{ width: '100%', height: '200px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                {coverImage ? (
                    <img src={coverImage} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No Image Available
                    </div>
                )}
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                    AVAILABLE
                </div>
            </div>
            <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px', color: 'var(--dark-slate)' }}>
                    {p.title || 'Untitled Rental'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                    {p.address}
                </p>
                
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px', fontWeight: 600 }}>
                    {p.bedrooms > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon d={ICONS.bed} size={12} /> {p.bedrooms} Bed
                    </span>}
                    {p.bathrooms > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon d={ICONS.bath} size={12} /> {p.bathrooms} Bath
                    </span>}
                    {p.size && <span>{p.size}</span>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-slate)' }}>RWF {Number(p.rent_amount).toLocaleString()}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> / mo</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Rent &rarr;
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function Landing() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const navigate = useNavigate();
    const location = useLocation();

    // Hash Scroll Logic
    useEffect(() => {
        const hash = location.hash;
        if (hash) {
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [location.hash, location.pathname]);

    useEffect(() => {
        api.getProperties()
            .then(data => {
                setProperties(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleAction = (p) => {
        navigate(`/listing/${p.id}`);
    };

    const filtered = properties.filter(p => {
        const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = activeFilter === 'All' || (activeFilter === 'Available' && p.status === 'available') || (activeFilter === 'Verified' && p.status === 'available');
        return matchSearch && matchFilter;
    });

    const heroImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)', background: 'var(--bg-primary)', minHeight: '100vh' }}>
            
            {/* Hero Section */}
            <section style={{
                position: 'relative',
                minHeight: '620px',
                display: 'flex',
                alignItems: 'center',
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.85)), url(${heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'var(--dark-slate)',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 5% 80px', width: '100%' }}>
                    <div style={{ maxWidth: '680px' }}>
                        <h1 style={{ 
                            fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', 
                            fontWeight: 800, 
                            letterSpacing: '-0.04em', 
                            color: '#ffffff', 
                            lineHeight: 1.15, 
                            marginBottom: '20px' 
                        }}>
                            Programmatic Trust for Home Rentals.
                        </h1>
                        
                        <p style={{ 
                            fontSize: '1.15rem', 
                            color: '#CBD5E1', 
                            maxWidth: '560px', 
                            marginBottom: '40px', 
                            lineHeight: 1.7,
                            fontWeight: 500
                        }}>
                            Rent secure homes around Kigali. Your safety deposit is held programmatically in a smart contract escrow vault — not by landlords.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <a href="#explore" className="btn btn-primary btn-lg" style={{ borderRadius: '8px', padding: '14px 32px', textDecoration: 'none' }}>
                                Find a Home &rarr;
                            </a>
                            <Link to="/register" className="btn btn-secondary btn-lg" style={{ 
                                borderRadius: '8px', 
                                padding: '14px 28px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)'
                            }}>
                                List Your Property
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Metrics Ribbon */}
            <div style={{ 
                maxWidth: '1200px', 
                margin: '-40px auto 64px', 
                position: 'relative', 
                zIndex: 10, 
                background: '#ffffff', 
                borderRadius: '6px', 
                display: 'flex', 
                gap: '24px', 
                justifyContent: 'space-around', 
                padding: '28px 24px', 
                flexWrap: 'wrap', 
                border: '1px solid rgba(226, 232, 240, 0.8)' 
            }}>
                {[
                    ['1,200+', 'Properties Managed'], 
                    ['840+', 'Active Tenants'], 
                    ['98%', 'Successful Mediations'], 
                    ['RWF 4.5B+', 'Escrow Protected']
                ].map(([val, lbl], i) => (
                    <div key={i} style={{ textAlign: 'center', flex: '1 1 200px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark-slate)', letterSpacing: '-0.02em' }}>{val}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{lbl}</div>
                    </div>
                ))}
            </div>

            {/* Capabilities / Listings Section */}
            <section id="explore" style={{ padding: '32px 5% 64px', scrollMarginTop: '100px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                        <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 800 }}>Explore Capabilities</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark-slate)', marginTop: '4px', letterSpacing: '-0.02em' }}>Verified Escrow Listings</h2>
                        </div>
                        
                        {/* Integrated search bar */}
                        <div style={{ width: '100%', maxWidth: '360px', position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search rentals or location..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 14px 10px 38px', borderRadius: '6px',
                                    border: '1px solid var(--border)', background: '#fff',
                                    fontSize: '0.88rem', outline: 'none', color: 'var(--text-primary)',
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        </div>
                    </div>

                    {/* Segment control categories */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '24px', scrollbarWidth: 'none' }}>
                        {FILTERS.map((f, i) => (
                            <button 
                                key={i} 
                                onClick={() => setActiveFilter(f)} 
                                style={{
                                    padding: '6px 16px', 
                                    borderRadius: '20px', 
                                    border: activeFilter === f ? 'none' : '1px solid var(--border)', 
                                    cursor: 'pointer',
                                    background: activeFilter === f ? 'var(--accent)' : 'transparent',
                                    color: activeFilter === f ? '#ffffff' : 'var(--text-secondary)',
                                    fontWeight: 700, 
                                    fontSize: '0.82rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: 600 }}>Syncing rental listings...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '32px' }}>
                            {filtered.map(p => (
                                <PropertyCard key={p.id} p={p} onAction={handleAction} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Network Security Section */}
            <section id="security" style={{ background: '#fff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 5%', scrollMarginTop: '100px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 800 }}>On-Chain Verification</span>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-slate)', marginTop: '4px', letterSpacing: '-0.02em' }}>Network Security</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '10px' }}>
                            EscrowChain utilizes Cardano multi-sig smart contracts to eliminate custodian risk from security deposits.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon d={ICONS.shield} size={20} color="var(--accent)" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Programmatic Escrow</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    Security deposits are locked directly into smart contracts. Neither the landlord nor the tenant can unilaterally claim or withdraw the funds.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon d={ICONS.key} size={20} color="var(--accent)" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Identity Verification</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    Participants verify their identity cryptographically using standard Cardano Web3 wallets (Nami, Eternl, Lace), preventing platform spoofing.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon d={ICONS.activity} size={20} color="var(--accent)" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Real-time Audit Trail</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    Every transaction, signature, and contract interaction is indexed on the public ledger for transparent audit compliance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solutions Section */}
            <section id="solutions" style={{ padding: '80px 5%', scrollMarginTop: '100px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 450px' }}>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 800 }}>Platform Solutions</span>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-slate)', marginTop: '4px', letterSpacing: '-0.02em', marginBottom: '20px' }}>
                                Conflict Resolution & Vaults
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.7', marginBottom: '24px' }}>
                                We provide full-lifecycle solutions for property rentals: on-chain lease compliance, automatic document vaulting, and decentralized mediation workflows when disputes arise.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Automated contract lifecycle tracking</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cryptographically secured lease document vault</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Decentralized arbitration by registered mediators</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: '1 1 350px', background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '40px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>Start Renting Securely</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
                                Create an account to register properties, propose leases, lock down deposits, and verify your tenancy.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Link to="/register" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', borderRadius: '6px' }}>
                                    Request Access
                                </Link>
                                <Link to="/login" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', borderRadius: '6px' }}>
                                    Sign In to Panel
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: 'var(--dark-slate)', padding: '64px 5% 48px', color: '#ffffff', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>E</div>
                        <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>EscrowChain Alliance</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
                        &copy; 2026 Programmatic trust infrastructure. Built for Cardano.
                    </p>
                </div>
            </footer>
        </div>
    );
}
