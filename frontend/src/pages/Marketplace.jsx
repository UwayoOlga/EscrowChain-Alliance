import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, BASE_URL } from '../api';

const Icon = ({ d, size = 16, color = 'currentColor', strokeWidth = 1.75 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const ICONS = {
    home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    bed: 'M3 7v11m0-7h18m0 0v7m0-7a2 2 0 00-2-2H9a2 2 0 00-2 2',
    bath: 'M4 12h16M4 12a2 2 0 01-2-2V8a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 01-2 2M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
};

export default function Marketplace() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProperties()
            .then(data => {
                const available = (Array.isArray(data) ? data : []).filter(p => p.status === 'available');
                setProperties(available);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page container fade-in"><p>Syncing Cardano ledger assets...</p></div>;

    return (
        <div className="page container fade-in" style={{ padding: '0 40px' }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 800 }}>On-Chain Registry</span>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '6px', marginBottom: '8px' }}>Available Assets</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
                        Browse verified properties backed by programmatic Cardano multi-sig escrow contracts.
                    </p>
                </div>
            </div>

            {properties.length === 0 ? (
                <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: '#fff', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                    <Icon d={ICONS.home} size={40} color="var(--text-muted)" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>No Listed Assets</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Check back soon as landlords register more properties onto the protocol.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                    {properties.map(p => {
                        const coverImage = p.primary_image ? `${BASE_URL}${p.primary_image}` : null;

                        return (
                            <Link to={`/properties/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                    border: '1px solid var(--border)'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ width: '100%', height: '220px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                                        {coverImage ? (
                                            <img src={coverImage} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                No Physical Media Available
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                                            VERIFIED
                                        </div>
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%', color: 'var(--dark-slate)' }}>
                                                {p.title || 'Untitled Asset'}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--success)' }}>
                                                <span className="pulse-dot" style={{ width: '6px', height: '6px', margin: 0 }}></span>
                                                ACTIVE
                                            </div>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.address}
                                        </p>
                                        <div style={{ display: 'flex', gap: '14px', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '16px', fontWeight: 600 }}>
                                            {p.bedrooms > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Icon d={ICONS.bed} size={12} /> {p.bedrooms} Bed
                                            </span>}
                                            {p.bathrooms > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Icon d={ICONS.bath} size={12} /> {p.bathrooms} Bath
                                            </span>}
                                            {p.size && <span>{p.size}</span>}
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
                                                <Icon d={ICONS.shield} size={12} color="var(--accent)" /> Escrow
                                            </span>
                                        </div>
                                        <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark-slate)' }}>RWF {Number(p.rent_amount).toLocaleString()}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> / mo</span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                ID: {p.id.substring(0, 8).toUpperCase()}
                                            </div>
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
