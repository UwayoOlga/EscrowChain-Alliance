import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, BASE_URL } from '../api';

export default function Marketplace() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProperties()
            .then(data => {
                // Filter to only show properties that are strictly available
                const available = (Array.isArray(data) ? data : []).filter(p => p.status === 'available');
                setProperties(available);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page container fade-in"><p>Loading Global Asset Market...</p></div>;

    return (
        <div className="page container fade-in" style={{ padding: '0 40px' }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <div>
                    <span className="text-overline" style={{ color: 'var(--accent)', fontWeight: 800 }}>Global Marketplace</span>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>Properties for Rent</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Discover verified EscrowChain assets and lock in your next home on the blockchain.
                    </p>
                </div>
            </div>

            {properties.length === 0 ? (
                <div style={{ padding: '100px 20px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px' }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No Available Assets</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Check back soon as landlords register more properties onto the chain.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                    {properties.map(p => {
                        const coverImage = p.primary_image ? `${BASE_URL}${p.primary_image}` : null;

                        return (
                            <Link to={`/properties/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                                    transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s',
                                    border: '1px solid var(--border)'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-6px)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)';
                                    }}
                                >
                                    <div style={{ width: '100%', height: '240px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                                        {coverImage ? (
                                            <img src={coverImage} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                                No Physical Image Uploaded
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', color: 'white', padding: '6px 12px', borderRadius: '32px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>
                                            AVAILABLE
                                        </div>
                                    </div>
                                    <div style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
                                                {p.title || 'Untitled Asset'}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 800 }}>
                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                                NEW
                                            </div>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.address}
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
                                            {p.bedrooms > 0 && <span>{p.bedrooms} Beds &bull;</span>}
                                            {p.bathrooms > 0 && <span>{p.bathrooms} Baths &bull;</span>}
                                            {p.size && <span>{p.size} &bull;</span>}
                                            <span>Smart Escrow</span>
                                        </div>
                                        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark-slate)' }}>RWF {p.rent_amount}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> / month</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
