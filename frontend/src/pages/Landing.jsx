import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="enterprise-landing">

            {/* HERO SECTION - Direct and clear business communication */}
            <section className="enterprise-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 style={{ marginBottom: '24px', letterSpacing: '-0.02em', fontSize: '3.5rem', lineHeight: 1.15 }}>
                            Immutable Escrow for Enterprise Real Estate
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '40px', maxWidth: '750px', lineHeight: 1.6 }}>
                            We replace traditional trust accounts with Cardano smart contracts. Lock security deposits, automate rent collection across portfolios, and instantly settle transactions with cryptographic certainty.
                        </p>
                        <div className="hero-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Link to="/register" className="btn btn-primary btn-lg btn-square">Book a Consultation</Link>
                            <Link to="/login" className="link-arrow" style={{ marginLeft: '12px' }}>View Technical Documentation &rarr;</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* VALUE PROPOSITION / PROBLEM SOLVED */}
            <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border)', backgroundColor: '#fff' }}>
                <div className="container">
                    <div className="grid grid-3">
                        <div>
                            <span className="text-overline">The Problem</span>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--dark-slate)', marginBottom: '12px', fontWeight: 700 }}>Legacy Escrow is Inefficient</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Traditional banks require manual reconciliation, take days to clear funds, and lock capital in opaque accounts vulnerable to internal disputes and human error.</p>
                        </div>
                        <div>
                            <span className="text-overline">Our Platform</span>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--dark-slate)', marginBottom: '12px', fontWeight: 700 }}>Programmatic Trust</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Deploy funds into multi-signature smart contracts. Capital only moves when pre-defined conditions (like verified condition reports or lease expiries) are met.</p>
                        </div>
                        <div>
                            <span className="text-overline">The Outcome</span>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--dark-slate)', marginBottom: '12px', fontWeight: 700 }}>Lower Costs, Zero Risk</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Eliminate third-party management fees and legal overhead. Transactions execute instantly globally, recorded permanently on the blockchain ledger.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PLATFORM CAPABILITIES */}
            <section className="enterprise-story">
                <div className="container">
                    <div className="story-intro">
                        <h2>Infrastructure Designed for Scale</h2>
                        <p>Manage thousands of leases through a unified, permissioned dashboard connected natively to the decentralized web.</p>
                    </div>

                    <div className="grid grid-2 story-cards">
                        <div className="card-minimal">
                            <h3>Multi-Signature Rent Payments</h3>
                            <p>Funds are secured instantly. Smart contracts verify payment completeness and distribute assets only upon multi-party cryptographic signature approval.</p>
                        </div>
                        <div className="card-minimal">
                            <h3>Automated Dispute Resolution</h3>
                            <p>Remove emotional arbitration. When disputes occur over property conditions or lease terms, funds are programmatically frozen pending auditable resolution paths.</p>
                        </div>
                        <div className="card-minimal">
                            <h3>Role-Based Access Control</h3>
                            <p>Distribute operational workload securely. Assign distinct functional dashboards to tenants reporting issues, landlords modifying leases, and regional administrators viewing analytics.</p>
                        </div>
                        <div className="card-minimal">
                            <h3>Property & Condition Tracking</h3>
                            <p>Tie physical assets to on-chain identities. Upload cryptographic hashes of condition reports directly alongside the lease parameters for immutable historical reference.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* INDUSTRY FOCUS */}
            <section className="enterprise-industry">
                <div className="container industry-split">
                    <div className="industry-text">
                        <h2>Powering Global Asset Management</h2>
                        <p>EscrowChain transforms liquidity and trust mechanisms for the world's leading portfolio managers.</p>
                        <Link to="/register" className="link-arrow dark" style={{ marginTop: '16px' }}>Read Client Case Studies &rarr;</Link>
                    </div>
                    <div className="industry-features">
                        <div className="feature-row">
                            <h4>Seamless Enterprise Integration</h4>
                            <p>Native API endpoints allow EscrowChain smart contracts to plug directly into your existing ERP systems.</p>
                        </div>
                        <div className="feature-row">
                            <h4>Web3 Treasury Custody</h4>
                            <p>Integrated natively with standard Cardano wallets for compliant corporate treasury and fund management.</p>
                        </div>
                        <div className="feature-row">
                            <h4>Global Localization</h4>
                            <p>Multi-lingual interfaces and cross-border payment settlement inherently baked into the ledger technology.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* LEAD GEN CTA */}
            <section className="enterprise-cta">
                <div className="container text-center">
                    <h2>Talk to a Solutions Architect</h2>
                    <p>Discover how EscrowChain reduces liability and operational overhead across your global real estate portfolio.</p>
                    <Link to="/register" className="btn btn-dark btn-lg btn-square">Schedule a Demo</Link>
                </div>
            </section>

            {/* ENTERPRISE FOOTER */}
            <footer className="enterprise-footer">
                <div className="container footer-content">
                    <div className="footer-brand">
                        <span className="brand-logo">EscrowChain Alliance</span>
                        <p style={{ maxWidth: '300px' }}>Global enterprise infrastructure for smart contract lease automation.</p>
                    </div>
                    <div className="footer-links">
                        <div className="link-col">
                            <strong>Platform Actions</strong>
                            <Link to="/register" className="footer-link">Integrate Cardano &rarr;</Link>
                            <Link to="/register" className="footer-link">Deploy Smart Contracts &rarr;</Link>
                            <Link to="/register" className="footer-link">Review Security Audits &rarr;</Link>
                        </div>
                        <div className="link-col">
                            <strong>Regional Operations</strong>
                            <Link to="/register" className="footer-link">Explore North America &rarr;</Link>
                            <Link to="/register" className="footer-link">Explore Europe &rarr;</Link>
                            <Link to="/register" className="footer-link">Explore Asia Pacific &rarr;</Link>
                        </div>
                    </div>
                </div>
                <div className="container footer-bottom">
                    <p>&copy; 2026 EscrowChain Alliance. All rights reserved.</p>
                    <div className="legal-links">
                        <Link to="/register" className="footer-link">Visit Trust Center</Link>
                        <Link to="/register" className="footer-link">View Compliance</Link>
                        <Link to="/register" className="footer-link">Read Privacy Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
