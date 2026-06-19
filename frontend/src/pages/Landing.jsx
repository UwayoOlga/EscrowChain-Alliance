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
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column'
            }}
            onClick={() => onAction(p)}
        >
            <div style={{ position: 'relative', height: '210px', backgroundColor: '#EFF6FF', overflow: 'hidden' }}>
                {cover ? (
                    <img src={cover} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#94A3B8' }}>
                        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <span style={{ fontSize: '0.78rem' }}>No photo yet</span>
                    </div>
                )}
                <div style={{
                    position: 'absolute', top: '12px', left: '12px',
                    background: p.status === 'available' ? 'rgba(5,150,105,0.92)' : 'rgba(217,119,6,0.92)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff', padding: '4px 10px', borderRadius: '20px',
                    fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em'
                }}>
                    {p.status === 'available' ? 'Available' : p.status}
                </div>
                <div style={{
                    position: 'absolute', bottom: '12px', right: '12px',
                    background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(6px)',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB', padding: '4px 10px', borderRadius: '20px',
                    fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                    <svg width="10" height="10" fill="none" stroke="#2563EB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Escrow Protected
                </div>
            </div>

            <div style={{ padding: '18px 20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', flex: 1, marginRight: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title || 'Unnamed Property'}
                    </h3>
                </div>
                <p style={{ fontSize: '0.83rem', color: '#94A3B8', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.address}
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#475569', marginBottom: '16px' }}>
                    {p.bedrooms > 0 && <span>{p.bedrooms} bed</span>}
                    {p.bathrooms > 0 && <span>{p.bathrooms} bath</span>}
                    {p.size && <span>{p.size}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                    <div>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>
                            RWF {Number(p.rent_amount || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/mo</span>
                    </div>
                    <button
                        onClick={() => onAction(p)}
                        style={{
                            background: p.status === 'available' ? '#2563EB' : '#E2E8F0',
                            color: p.status === 'available' ? '#fff' : '#94A3B8',
                            border: 'none', borderRadius: '8px', padding: '8px 16px',
                            fontWeight: 700, fontSize: '0.82rem', cursor: p.status === 'available' ? 'pointer' : 'default',
                            transition: 'background 0.15s'
                        }}
                    >
                        {p.status === 'available' ? 'View & Rent' : 'Occupied'}
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
        <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif", color: '#1E293B', background: '#F8FAFC', minHeight: '100vh' }}>

            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: scrolled ? 'rgba(255,255,255,0.97)' : '#fff',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #E2E8F0',
                padding: isMobile ? '0 16px' : '0 5%', height: '68px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'box-shadow 0.2s',
                boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.07)' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>E</div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#1E293B', display: isMobile ? 'none' : 'block' }}>EscrowChain</span>
                </div>

                <div style={{ flex: 1, maxWidth: '420px', margin: isMobile ? '0 12px' : '0 32px' }}>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Find assets..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 14px 10px 40px', borderRadius: '24px',
                                border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                                fontSize: '0.875rem', outline: 'none', color: '#1E293B'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link to="/login" style={{ color: '#475569', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0' }}>{isMobile ? 'Login' : 'Sign in'}</Link>
                    {!isMobile && <Link to="/register" style={{ background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', padding: '9px 20px', borderRadius: '8px' }}>Join</Link>}
                </div>
            </nav>

            <section style={{
                paddingTop: '68px',
                position: 'relative',
                minHeight: '520px',
                display: 'flex',
                alignItems: 'center',
                backgroundImage: `linear-gradient(rgba(0, 4, 8, 0.7), rgba(0, 4, 8, 0.7)), url(${heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#1E293B',
                borderBottom: '1px solid #E2E8F0'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 5% 48px', width: '100%', textAlign: isMobile ? 'center' : 'left' }}>
                    <div style={{ maxWidth: isMobile ? '100%' : '650px', margin: isMobile ? '0 auto' : '0' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '32px', padding: '5px 14px', marginBottom: '24px', fontSize: '0.75rem', fontWeight: 700, color: '#60A5FA' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                            SECURED ASSETS · KIGALI
                        </div>
                        <h1 style={{ fontSize: isMobile ? '2.1rem' : 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
                            Trustless rentals in Rwanda.
                        </h1>
                        <p style={{ fontSize: '1.1rem', color: '#CBD5E1', maxWidth: '540px', marginBottom: '40px', lineHeight: 1.7 }}>
                            Browse verified properties across Kigali. Your security deposit is locked in a smart contract and not with the landlord.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                            <Link to="/register" style={{ background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', padding: '14px 32px', borderRadius: '10px', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
                                Browse rentals &rarr;
                            </Link>
                            <Link to="/register" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', padding: '14px 28px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                                List a property
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div style={{ maxWidth: '1200px', margin: '-30px auto 48px', position: 'relative', zIndex: 10, background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', gap: '40px', justifyContent: 'center', padding: '24px', flexWrap: 'wrap', border: '1px solid #E2E8F0' }}>
                {[['1,200+', 'Properties listed'], ['840+', 'Active tenants'], ['98%', 'Disputes resolved'], ['RWF 4.5B+', 'Escrow secured']].map(([val, lbl], i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B' }}>{val}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', textTransform: 'uppercase', fontWeight: 700 }}>{lbl}</div>
                    </div>
                ))}
            </div>

            <div style={{ position: 'sticky', top: '68px', zIndex: 50, background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 5%' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '4px', overflowX: 'auto', padding: '14px 0', scrollbarWidth: 'none' }}>
                    {FILTERS.map((f, i) => (
                        <button key={i} onClick={() => setActiveFilter(f)} style={{
                            padding: '8px 20px', borderRadius: '24px', border: 'none', cursor: 'pointer',
                            background: activeFilter === f ? '#2563EB' : 'transparent',
                            color: activeFilter === f ? '#fff' : '#64748B',
                            fontWeight: 600, fontSize: '0.875rem'
                        }}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <section style={{ padding: '40px 5% 80px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px', color: '#94A3B8' }}>Loading portfolio...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '24px' }}>
                            {filtered.map(p => (
                                <PropertyCard key={p.id} p={p} onAction={handleAction} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <footer style={{ background: '#1E293B', padding: '60px 5% 40px', color: '#fff' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>E</div>
                        <span style={{ fontWeight: 800 }}>EscrowChain Alliance</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>© 2026 Blockchain-secured rentals in Rwanda. Built for the Decentralized Future.</p>
                </div>
            </footer>
        </div>
    );
}
