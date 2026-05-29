import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="enterprise-landing">
            {/* HERO SECTION */}
            <section className="enterprise-hero" style={{ padding: '160px 0', backgroundColor: 'var(--dark-slate)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)', zxIndex: 0 }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="hero-content" style={{ maxWidth: '850px' }}>
                        <span className="text-overline" style={{ color: 'var(--accent-subtle)', marginBottom: '32px' }}>Next-Generation Escrow Layer</span>
                        <h1 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.05, marginBottom: '24px', letterSpacing: '-0.04em', color: '#fff' }}>
                            The Operating System for <span style={{ color: 'var(--accent)' }}>Programmable Trust</span>.
                        </h1>
                        <p style={{ fontSize: '1.4rem', color: '#cbd5e1', marginBottom: '48px', lineHeight: 1.5, fontWeight: 400 }}>
                            EscrowChain replaces traditional legal uncertainty with Cardano-backed smart contracts. Verify assets, automate institutional rent collection, and settle security deposits in milliseconds.
                        </p>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <Link to="/register" className="btn btn-primary btn-lg btn-square" style={{ padding: '20px 40px', fontSize: '1.1rem' }}>Initiated Platform Onboarding</Link>
                            <Link to="/login" style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                                View Technical Whitepaper
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST AUTHORITY BAR */}
            <section style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '40px 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6, filter: 'grayscale(1)' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-muted)' }}>CARDANO FOUNDATION</span>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-muted)' }}>MESH SDK</span>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-muted)' }}>ALLIANCE CAPITAL</span>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-muted)' }}>ESCROW NODE</span>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-muted)' }}>BLOCKFROST</span>
                    </div>
                </div>
            </section>

            {/* STRATEGIC SOLUTIONS */}
            <section style={{ padding: '120px 0', background: '#fff' }}>
                <div className="container">
                    <div style={{ maxWidth: '700px', marginBottom: '80px' }}>
                        <span className="text-overline">Solutions Architecture</span>
                        <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--dark-slate)', letterSpacing: '-0.02em', marginTop: '12px' }}>
                            Tailored Infrastructure for the Real Estate Lifecycle.
                        </h2>
                    </div>

                    <div className="grid grid-3">
                        <div className="card-minimal" style={{ borderTop: '4px solid var(--accent)' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '16px', textTransform: 'uppercase' }}>For Asset Managers</div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Institutional Portfolios</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Manage thousands of high-value properties through automated cryptographic escrow, reducing administrative overhead by 90% and eliminating payment lag.</p>
                        </div>
                        <div className="card-minimal">
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>For Enterprises</div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Corporate Leasing</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Deploy multi-signature security deposits that protect corporate capital from landlord insolvency while ensuring immediate availability upon audit completion.</p>
                        </div>
                        <div className="card-minimal">
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>For Governments</div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Regulatory Oversight</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Establish public ledgers of rental compliance and housing security through auditable smart contract histories, ensuring fairness and preventing fraud.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* TECHNICAL PROOF / INTEGRATION */}
            <section style={{ padding: '120px 0', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="container grid grid-2" style={{ alignItems: 'center', gap: '100px' }}>
                    <div>
                        <span className="text-overline">The Protocol</span>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--dark-slate)', marginBottom: '24px' }}>Immutable, Automated, Transparent.</h2>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '24px', padding: 0 }}>
                            <li style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }}></div>
                                <div>
                                    <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Plutus-V2 Smart Contracts</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Logic-based transactions that handle funds without intermediaries.</p>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '24px', height: '24px', background: 'var(--dark-slate)', borderRadius: '50%', flexShrink: 0 }}></div>
                                <div>
                                    <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Deterministic Finality</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cardano Settlement Layer ensures transactions are final once confirmed.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div style={{ background: 'var(--dark-slate)', padding: '48px', borderRadius: '4px', boxShadow: 'var(--shadow-lg)' }}>
                        <code style={{ color: '#fff', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            <span style={{ color: 'var(--accent)' }}>deploy</span> lease_contract ( <br />
                            &nbsp;&nbsp;landlord: 0x82...f9e, <br />
                            &nbsp;&nbsp;tenant: 0x3d...a1b, <br />
                            &nbsp;&nbsp;escrow_amount: 5000_ADA, <br />
                            &nbsp;&nbsp;release_trigger: ["condition_audit_verified"] <br />
                            ); <br /><br />
                            <span style={{ color: '#22c55e' }}>// Deployment Successful: Tx_Hash: 92k...8f</span>
                        </code>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '140px 0', background: 'var(--accent)', color: '#fff' }}>
                <div className="container text-center">
                    <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '32px' }}>Secure Your Global Portfolio.</h2>
                    <p style={{ fontSize: '1.25rem', marginBottom: '48px', opacity: 0.9, maxWidth: '600px', margin: '0 auto 48px' }}>Join the Alliance of institutions migrating to programmatic escrow.</p>
                    <Link to="/register" className="btn btn-dark btn-lg btn-square" style={{ background: '#fff', color: 'var(--accent)', padding: '20px 48px' }}>Request Enterprise Key</Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ padding: '100px 0 60px', backgroundColor: 'var(--dark-slate)', color: '#fff' }}>
                <div className="container">
                    <div className="grid grid-4" style={{ marginBottom: '80px', gap: '64px' }}>
                        <div style={{ gridColumn: 'span 1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '32px', height: '32px', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, borderRadius: '2px' }}>E</div>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>EscrowChain</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>The global infrastructure layer for decentralized real estate escrow and automated audit reporting.</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '24px', textTransform: 'uppercase' }}>Capabilities</h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: '#94a3b8' }}>
                                <li>Asset Tokenization</li>
                                <li>Escrow Automation</li>
                                <li>Dispute Mediation</li>
                                <li>Yield Optimization</li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '24px', textTransform: 'uppercase' }}>Ecosystem</h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: '#94a3b8' }}>
                                <li>Cardano Mainnet</li>
                                <li>Plutus-V2 Audits</li>
                                <li>Network Status</li>
                                <li>API Reference</li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '24px', textTransform: 'uppercase' }}>Corporate</h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: '#94a3b8' }}>
                                <li>Trust Center</li>
                                <li>Privacy Policy</li>
                                <li>Regulatory Compliance</li>
                                <li>Contact Sales</li>
                            </ul>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                        <span>&copy; 2026 EscrowChain Alliance. Engineered for Decentralized Fidelity.</span>
                        <div style={{ display: 'flex', gap: '32px' }}>
                            <span>Terms</span>
                            <span>Security</span>
                            <span>Status</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
