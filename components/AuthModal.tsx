import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Hexagon, Chrome, Loader2, Key } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase-config';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setMessage(null);
            setLoading(false);
            setIsVerifying(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Traditionally this would use Firebase Email/Password auth too,
        // but for now we'll stick to the legacy backend logic if user wants.
        // However, the prompt emphasizes Firebase, so Google is the priority.
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const body = isLogin ? { email, password } : { email, password, name };

        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok) {
                if (!isLogin && data.success) {
                    setIsVerifying(true);
                    setMessage({ type: 'success', text: 'OTP sent to your email!' });
                } else if (isLogin && data.success) {
                    setMessage({ type: 'success', text: 'Successfully logged in!' });
                    setTimeout(() => {
                        onLogin(data.user);
                        onClose();
                    }, 1500);
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Authentication failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Server error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const res = await fetch('http://localhost:5000/auth/firebase-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Google Login Successful!' });
                setTimeout(() => {
                    onLogin(data.user);
                    onClose();
                }, 1000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Backend verification failed' });
            }
        } catch (error: any) {
            console.error('Google Auth Error:', error);
            setMessage({ type: 'error', text: error.message || 'Google login failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('http://localhost:5000/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Account verified successfully!' });
                setTimeout(() => {
                    onLogin(data.user);
                    onClose();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: data.error || 'Invalid OTP' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Verification failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-scale-in border border-white/20 max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400" />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all z-10"><X size={20} /></button>

                <div className="p-8 sm:p-10">
                    <div className="mb-6 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
                            <Hexagon size={24} fill="white" className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-1">
                            {isVerifying ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Join the Alliance')}
                        </h2>
                        <p className="text-xs text-slate-500 font-bold px-4">
                            {isVerifying ? `Enter the code sent to ${email}` : (isLogin ? 'Access your secure property escrow.' : 'The leading decentralized rental protocol.')}
                        </p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-shake ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <p className="text-sm font-bold">{message.text}</p>
                        </div>
                    )}

                    {!isVerifying ? (
                        <>
                            <form onSubmit={handleEmailAuth} className="space-y-4">
                                {!isLogin && (
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                        <input type="text" placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-semibold" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
                                    </div>
                                )}
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input type="email" placeholder="Email Address" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-semibold" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input type="password" placeholder="Password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-semibold" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group disabled:opacity-70">
                                    {loading ? <Loader2 className="animate-spin" size={24} /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                                </button>
                            </form>

                            <div className="mt-8">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-black tracking-widest">Or continue with</span></div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <button onClick={handleGoogleLogin} disabled={loading} className="flex items-center justify-center gap-2 py-4 px-3 border-2 border-slate-50 hover:border-blue-100 rounded-2xl transition-all hover:bg-slate-50 font-bold text-sm text-slate-600 disabled:opacity-70">
                                        <Chrome size={20} className="text-red-500" /> Login with Google
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input type="text" placeholder="6-digit Code" maxLength={6} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-black text-center text-2xl tracking-[10px]" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loading} required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 group disabled:opacity-70">
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <>Verify & Complete <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                            </button>
                            <button type="button" onClick={() => setIsVerifying(false)} className="w-full py-2 text-sm text-slate-500 font-bold hover:text-slate-900 transition-colors">Back to signup</button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-slate-500 font-bold text-sm">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline font-extrabold">{isLogin ? 'Sign Up' : 'Sign In'}</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
