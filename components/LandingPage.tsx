import React from 'react';
import { Shield, Lock, Zap, ArrowRight, CheckCircle, Globe, Users, BarChart3, Hexagon } from 'lucide-react';
import WalletConnect from './WalletConnect';
import propertyImage from './assets/premium_property_kigali.png';
import heroImage from './assets/LandingPageImageForHeroSection.jpg';
import disputeImage from './assets/disputesResolutio.webp';
import AuthModal from './AuthModal';
import { WalletState } from '../types';

interface LandingPageProps {
    onLogin: (user: any) => void;
    wallet: WalletState;
    setWallet: (wallet: WalletState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, wallet, setWallet }) => {
    const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <Hexagon size={24} fill="white" className="text-blue-600" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight text-slate-900 italic">ESCROWCHAIN<span className="text-blue-600">ALLIANCE</span></span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">How it Works</a>
                            <a href="#properties" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Properties</a>
                            <WalletConnect wallet={wallet} setWallet={setWallet} />
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                            >
                                Login / Register
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="relative z-10 animate-fade-in-up">
                            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                <Zap size={14} />
                                <span>Powered by Cardano Blockchain</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6">
                                Secure Your <span className="text-blue-600">Rent</span> with Trustless Escrow.
                            </h1>
                            <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
                                Connect landlords and tenants through immutable smart contracts. Transparent payments, automated refunds, and secure deposits on the world's most stable blockchain.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 group"
                                >
                                    Get Started Now
                                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <div className="flex items-center px-4 space-x-[-12px]">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                        </div>
                                    ))}
                                    <div className="ml-4 text-sm font-bold text-slate-500">+1.2k joined this week</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative lg:h-[600px] animate-fade-in-up delay-200">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[40px] rotate-3 -z-10"></div>
                            <img
                                src={heroImage}
                                alt="Blockchain Real Estate"
                                className="w-full h-full object-cover rounded-[32px] shadow-2xl border-8 border-white"
                            />
                            <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/50 hidden sm:block">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Transaction</span>
                                    <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                                        Verified
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">₳</div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Rent Payment Locked</p>
                                        <p className="text-xs text-slate-500">1200 ADA • Escrow #EC-9921</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Core Technology</h2>
                        <h3 className="text-3xl lg:text-5xl font-bold text-slate-900 px-4">Why Choose EscrowChain Alliance?</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Shield className="text-blue-600" size={32} />,
                                title: "Smart Escrow",
                                desc: "Funds are held in a secure smart contract and only released when both parties agree or lease terms are met."
                            },
                            {
                                icon: <Lock className="text-purple-600" size={32} />,
                                title: "Immutable History",
                                desc: "Every payment, inspection, and maintenance request is recorded permanently on the Cardano ledger."
                            },
                            {
                                icon: <Globe className="text-green-600" size={32} />,
                                title: "Global Compliance",
                                desc: "Built-in tax reporting and regulatory compliance tools for landlords across different jurisdictions."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className="mb-6 bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center italic">
                                    {feature.icon}
                                </div>
                                <h4 className="text-xl font-bold mb-4">{feature.title}</h4>
                                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Property Showcase */}
            <section id="properties" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <img
                                src={propertyImage}
                                alt="Verified Property"
                                className="w-full h-[500px] object-cover rounded-[40px] shadow-2xl"
                            />
                        </div>
                        <div className="lg:w-1/2">
                            <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Verified Listings</h2>
                            <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">Hand-picked properties with guaranteed safety.</h3>
                            <p className="text-lg text-slate-600 mb-8">
                                We verify every landlord and every property documentation. Our Alliance members get early access to high-demand properties in emerging crypto-hubs.
                            </p>
                            <ul className="space-y-4 mb-10">
                                {[
                                    "Certified inspection reports included",
                                    "Direct landlord-to-tenant communication",
                                    "Transparent pricing with no hidden fees",
                                    "Instant lease generation & signing"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center space-x-3">
                                        <CheckCircle className="text-green-500" size={20} />
                                        <span className="font-semibold text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="text-blue-600 font-bold flex items-center hover:underline group"
                            >
                                Browse all properties <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dispute Resolution Section */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 skew-x-12 translate-x-32 -z-0"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Fair Resolution</h2>
                            <h3 className="text-4xl lg:text-5xl font-bold mb-6">Transparency when you need it most.</h3>
                            <p className="text-slate-400 text-lg mb-8">
                                Disputes are handled through our decentralized resolution center. Using evidence-based arbitration, we ensure fair outcomes for both parties without expensive legal fees.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                    <div className="text-3xl font-bold text-blue-400 mb-1">99.8%</div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Success Rate</p>
                                </div>
                                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                    <div className="text-3xl font-bold text-blue-400 mb-1">&lt; 24h</div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Avg. Resolution</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <img
                                src={disputeImage}
                                alt="Dispute Resolution Interface"
                                className="rounded-3xl shadow-2xl border border-slate-700"
                            />
                            <div className="absolute -top-6 -right-6 bg-blue-600 p-6 rounded-3xl shadow-xl animate-bounce">
                                <Users size={32} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-6">
                                <div className="bg-blue-600 p-1.5 rounded-lg">
                                    <Hexagon size={24} fill="white" className="text-blue-600" />
                                </div>
                                <span className="text-xl font-extrabold tracking-tight text-slate-900 italic">ESCROWCHAIN<span className="text-blue-600">ALLIANCE</span></span>
                            </div>
                            <p className="text-slate-500 max-w-sm mb-8">
                                The leading decentralized protocol for secure rental management and blockchain-backed escrow solutions.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-bold mb-6">Company</h5>
                            <ul className="space-y-4 text-slate-500 text-sm">
                                <li><a href="#" className="hover:text-blue-600">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-600">Alliance Network</a></li>
                                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                                <li><a href="#" className="hover:text-blue-600">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-bold mb-6">Resources</h5>
                            <ul className="space-y-4 text-slate-500 text-sm">
                                <li><a href="#" className="hover:text-blue-600">Smart Contracts</a></li>
                                <li><a href="#" className="hover:text-blue-600">Developer Portal</a></li>
                                <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                                <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-400">© 2026 EscrowChain-Alliance. All rights reserved.</p>
                        <div className="flex items-center space-x-6">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by Cardano</span>
                            <div className="h-4 w-px bg-gray-200"></div>
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors pt-1">𝕏</div>
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors pt-1">🌐</div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={onLogin}
            />
        </div>
    );
};

export default LandingPage;
