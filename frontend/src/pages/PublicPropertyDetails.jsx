import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function PublicPropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                setLoading(true);
                // We use the direct fetch since api.getProperty might have auth attached in some versions, 
                // but our GET /api/properties/:id is public.
                const res = await fetch(`http://localhost:5000/api/properties/${id}`);
                if (!res.ok) throw new Error('Property not found');
                const data = await res.json();
                setProperty(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();

        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [id]);

    const handleApply = () => {
        // Redirect to login with a back-reference to this property
        navigate(`/login?redirect=/properties/${id}`);
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#64748B', fontWeight: 600 }}>Syncing with Asset Ledger...</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error || !property) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏘️</div>
                <h2 style={{ fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Asset not found</h2>
                <p style={{ color: '#64748B', marginBottom: '24px' }}>The property you are looking for might have been unlisted or moved.</p>
                <Link to="/" style={{ background: '#2563EB', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 700 }}>Back to Marketplace</Link>
            </div>
        </div>
    );

    const images = property.images ? JSON.parse(property.images) : [];
    const mainImage = images.length > 0 ? `http://localhost:5000${images[0]}` : null;

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1E293B', background: '#fff', minHeight: '100vh' }}>

            {/* ── HEADER ── */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: scrolled ? '1px solid #E2E8F0' : 'none',
                height: '72px', padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.3s'
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <div style={{ width: '32px', height: '32px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>E</div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: scrolled ? '#1E293B' : '#fff', textShadow: scrolled ? 'none' : '0 2px 4px rgba(0,0,0,0.2)' }}>EscrowChain</span>
                </Link>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/login" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: scrolled ? '#1E293B' : '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', border: scrolled ? '1px solid #E2E8F0' : '1px solid rgba(255,255,255,0.3)' }}>Sign in</Link>
                    <Link to="/register" style={{ background: '#2563EB', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>Get Started</Link>
                </div>
            </header>

            {/* ── IMAGE GALLERY (GRID STYLE) ── */}
            <section style={{ padding: '80px 5% 40px', background: scrolled ? '#fff' : '#1E293B' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', color: scrolled ? '#1E293B' : '#fff' }}>
                        <div>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.03em' }}>{property.title}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', opacity: 0.9 }}>
                                <span>📍 {property.address}</span>
                                <span style={{ width: '4px', height: '4px', background: 'currentColor', borderRadius: '50%' }} />
                                <span style={{ fontWeight: 700, color: '#60A5FA' }}>Escrow Verified</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                Share
                            </button>
                        </div>
                    </div>

                    <div style={{
                        height: '500px', display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr',
                        gap: '12px', borderRadius: '16px', overflow: 'hidden'
                    }}>
                        {/* Main Image */}
                        <div style={{ gridRow: 'span 2', position: 'relative', background: '#F1F5F9' }}>
                            {mainImage ? <img src={mainImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Main" /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>No Photo</div>}
                        </div>
                        {/* Smaller Images */}
                        {[1, 2, 3, 4].map(idx => (
                            <div key={idx} style={{ background: '#F1F5F9', position: 'relative', overflow: 'hidden' }}>
                                {images[idx] ? (
                                    <img src={`http://localhost:5000${images[idx]}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`View ${idx}`} />
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#E2E8F0' }}>
                                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CONTENT & STICKY CARD ── */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 5% 100px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '80px' }}>

                {/* LEFT: Details */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '32px', borderBottom: '1px solid #F1F5F9', marginBottom: '32px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Entire unit hosted by Landlord</h2>
                            <p style={{ color: '#64748B' }}>{property.bedrooms} bedrooms · {property.bathrooms} bathrooms · {property.size || 'Standard Size'}</p>
                        </div>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                    </div>

                    <section style={{ marginBottom: '48px' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '24px' }}>Description</h3>
                        <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                            {property.description || 'Welcome to this premium Kigali property. Perfectly suited for secure, modern living in Rwanda.'}
                        </p>
                    </section>

                    <section style={{ marginBottom: '48px' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '24px' }}>Amenities</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {(property.amenities || 'Kitchen,Parking,Security').split(',').map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '1rem' }}>
                                    <div style={{ width: '24px', textAlign: 'center' }}>✨</div>
                                    <span>{item.trim()}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section style={{ padding: '32px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '2rem' }}>🛡️</div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>Escrow Protection Enabled</h3>
                                <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6 }}>Your security deposit for this property will be guarded by a Cardano Smart Contract. Funds are only released when the lease ends or both parties agree.</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* RIGHT: Sticky Pricing Card */}
                <aside>
                    <div style={{
                        position: 'sticky', top: '100px',
                        background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{ marginBottom: '24px' }}>
                            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B' }}>RWF {Number(property.rent_amount).toLocaleString()}</span>
                            <span style={{ color: '#64748B', fontSize: '1rem' }}> / month</span>
                        </div>

                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>Property ID</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{property.id.substring(0, 8)}</div>
                            </div>
                            <div style={{ padding: '12px 16px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>Required Deposit</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669' }}>RWF {Number(property.deposit_amount).toLocaleString()}</div>
                            </div>
                        </div>

                        <button
                            onClick={handleApply}
                            style={{
                                width: '100%', background: '#2563EB', color: '#fff', border: 'none',
                                padding: '16px', borderRadius: '12px', fontWeight: 800, fontSize: '1rem',
                                cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                                marginBottom: '16px'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Apply to Rent
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8' }}>You won't be charged yet. The landlord must approve your application first.</p>

                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#475569' }}>
                                <span>Monthly Rent</span>
                                <span style={{ fontWeight: 600 }}>RWF {Number(property.rent_amount).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#475569' }}>
                                <span>Blockchain Escrow Fee</span>
                                <span style={{ fontWeight: 600, color: '#059669' }}>FREE</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #F1F5F9', paddingTop: '16px', marginTop: '16px', fontSize: '1.1rem', fontWeight: 800 }}>
                                <span>Total (excl. dep.)</span>
                                <span>RWF {Number(property.rent_amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* ── FOOTER ── */}
            <footer style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '60px 5%' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '24px', height: '24px', background: '#2563EB', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>E</div>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>EscrowChain Allianz</span>
                    </div>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>© 2026 EscrowChain. Building trust in Rwanda property rentals through blockchain.</p>
                </div>
            </footer>
        </div>
    );
}
