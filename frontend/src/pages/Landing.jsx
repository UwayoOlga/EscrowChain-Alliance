import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BASE_URL } from '../api';
import heroImage from '../assets/hero_modern.png';

const FILTERS = ['All', 'Available', 'Apartments', 'Houses', 'Studios'];

function PropertyCard({ p, onAction }) {
    let images = [];
    try { images = JSON.parse(p.images || '[]'); } catch { }
    const cover = images.length > 0 ? `${BASE_URL}${images[0]}` : null;

    return (
        <div
            className="hover-lift"
            style={{
                background: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'
            }}
            onClick={() => onAction(p)}
        >
            <div style={{ position: 'relative', height: '220px', backgroundColor: '#EFF6FF', overflow: 'hidden' }}>
                {cover ? (
                    <img src={cover} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#94A3B8' }}>
                        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                        </svg>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>No Image Available</span>
                    </div>
                )}
                
                {/* Status Badges */}
                <div style={{
                    position: 'absolute', top: '12px', left: '12px',
                    background: p.status === 'available' ? 'rgba(5, 150, 105, 0.95)' : 'rgba(217, 119, 6, 0.95)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff', padding: '5px 12px', borderRadius: '6px',
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    {p.status === 'available' ? 'Available' : p.status}
                </div>
                
                <div style={{
                    position: 'absolute', bottom: '12px', right: '12px',
                    background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(191, 219, 254, 0.8)',
                    color: 'var(--accent)', padding: '5px 12px', borderRadius: '6px',
                    fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <span className="pulse-dot" style={{ margin: 0 }}></span>
                    Escrow Protected
                </div>
            </div>

            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark-slate)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title || 'Untitled Rental'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                        {p.address}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '18px', fontWeight: 600 }}>
                        {p.bedrooms > 0 && <span>🛏️ {p.bedrooms} Beds</span>}
                        {p.bathrooms > 0 && <span>🚿 {p.bathrooms} Baths</span>}
                        {p.size && <span>📐 {p.size}</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-slate)' }}>
                            RWF {Number(p.rent_amount || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/month</span>
                    </div>
                    <button
                        onClick={() => onAction(p)}
                        className="btn btn-primary"
                        style={{
                            borderRadius: '8px', 
                            padding: '8px 16px',
                            fontWeight: 700, 
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            background: p.status === 'available' ? 'var(--accent)' : 'var(--bg-secondary)',
                            color: p.status === 'available' ? '#fff' : 'var(--text-muted)',
                            border: p.status === 'available' ? 'none' : '1px solid var(--border)',
                            boxShadow: 'none'
                        }}
                        disabled={p.status !== 'available'}
                    >
                        {p.status === 'available' ? 'View Details' : 'Occupied'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Landing() {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 800);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetch(`${BASE_URL}/api/properties`)
            .then(r => r.json())
            .then(data => setProperties(Array.isArray(data) ? data : []))
            .catch(() => setProperties([]))
            .finally(() => setLoading(false));

        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleAction = (p) => {
        navigate(`/listing/${p.id}`);
    };

    const filtered = properties.filter(p => {
        const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = activeFilter === 'All' || (activeFilter === 'Available' && p.status === 'available');
        return matchSearch && matchFilter;
    });

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)', background: 'var(--bg-primary)', minHeight: '100vh' }}>
            
            {/* Header Navigation */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: scrolled ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: '1px solid var(--border)',
                padding: isMobile ? '0 16px' : '0 5%', height: '72px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.3s ease',
                boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>E</div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--dark-slate)', display: isMobile ? 'none' : 'block' }}>EscrowChain</span>
                </div>

                <div style={{ flex: 1, maxWidth: '420px', margin: isMobile ? '0 12px' : '0 32px' }}>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search rentals by title or location..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px 12px 42px', borderRadius: '24px',
                                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                fontSize: '0.88rem', outline: 'none', color: 'var(--text-primary)',
                                transition: 'all 0.2s ease'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link to="/login" className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', fontWeight: 700 }}>
                        {isMobile ? 'Sign In' : 'Sign In'}
                    </Link>
                    {!isMobile && (
                        <Link to="/register" className="btn btn-primary btn-sm" style={{ borderRadius: '8px', fontWeight: 700 }}>
                            Get Started
                        </Link>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                paddingTop: '72px',
                position: 'relative',
                minHeight: '540px',
                display: 'flex',
                alignItems: 'center',
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'var(--dark-slate)',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '60px 20px' : '80px 5% 60px', width: '100%', textAlign: isMobile ? 'center' : 'left' }}>
                    <div style={{ maxWidth: isMobile ? '100%' : '680px', margin: isMobile ? '0 auto' : '0' }}>
                        <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            background: 'rgba(37, 99, 235, 0.15)', 
                            border: '1px solid rgba(59, 130, 246, 0.3)', 
                            borderRadius: '30px', 
                            padding: '6px 14px', 
                            marginBottom: '24px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: '#60A5FA',
                            letterSpacing: '0.04em'
                        }}>
                            <span className="pulse-dot" style={{ margin: 0 }}></span>
                            VERIFIED ESCROW LEDGERS · RWANDA
                        </div>
                        
                        <h1 style={{ 
                            fontSize: isMobile ? '2.25rem' : 'clamp(2.5rem, 6vw, 3.75rem)', 
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
                            Rent secure homes around Kigali. Your safety deposit is held programmatically in a smart contract escrow vault—not by landlords.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                            <Link to="/register" className="btn btn-primary btn-lg" style={{ borderRadius: '8px', padding: '14px 32px' }}>
                                Find a Home &rarr;
                            </Link>
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
                margin: '-40px auto 48px', 
                position: 'relative', 
                zIndex: 10, 
                background: '#ffffff', 
                borderRadius: '12px', 
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', 
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

            {/* Segment control categories */}
            <div style={{ position: 'sticky', top: '72px', zIndex: 50, background: '#ffffff', borderBottom: '1px solid var(--border)', padding: '0 5%' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '8px', overflowX: 'auto', padding: '16px 0', scrollbarWidth: 'none' }}>
                    {FILTERS.map((f, i) => (
                        <button 
                            key={i} 
                            onClick={() => setActiveFilter(f)} 
                            style={{
                                padding: '8px 20px', 
                                borderRadius: '20px', 
                                border: 'none', 
                                cursor: 'pointer',
                                background: activeFilter === f ? 'var(--accent)' : 'transparent',
                                color: activeFilter === f ? '#ffffff' : 'var(--text-secondary)',
                                fontWeight: 700, 
                                fontSize: '0.85rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Property Grid Section */}
            <section style={{ padding: '48px 5% 96px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)', fontWeight: 600 }}>Syncing rental listings...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '32px' }}>
                            {filtered.map(p => (
                                <PropertyCard key={p.id} p={p} onAction={handleAction} />
                            ))}
                        </div>
                    )}
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
