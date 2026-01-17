import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Payment from './components/Payment';
import PropertyStatus from './components/PropertyStatus';
import DisputeResolution from './components/DisputeResolution';
import AdminDashboard from './components/AdminDashboard';
import WalletConnect from './components/WalletConnect';
import { UserRole, WalletState, Property } from './types';
import { MOCK_PROPERTIES } from './constants';
import { Bell, Menu, X } from 'lucide-react';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>('tenant');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const fetchProperties = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/properties');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProperties(data);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentView('dashboard');
    fetchProperties();
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/auth/logout', { credentials: 'include' });
      setUser(null);
      setCurrentView('landing');
      setProperties([]);
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback
      setUser(null);
      setCurrentView('landing');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:5000/auth/status', { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setCurrentView('dashboard');
          fetchProperties();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, []);

  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    balance: 0,
    provider: null
  });

  // Reset scroll position when view changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingPage onLogin={handleLogin} wallet={wallet} setWallet={setWallet} />;
      case 'dashboard': return <Dashboard role={role} userProperties={properties} />;
      case 'payment': return <Payment properties={properties} wallet={wallet} />;
      case 'property': return <PropertyStatus properties={properties} role={role} />;
      case 'dispute': return <DisputeResolution role={role} />;
      case 'admin': return <AdminDashboard />;
      default: return <Dashboard role={role} userProperties={properties} />;
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Overview';
      case 'payment': return 'Rent & Payments';
      case 'property': return 'My Properties';
      case 'dispute': return 'Resolution Center';
      case 'admin': return 'System Admin';
      default: return 'Dashboard';
    }
  };

  if (currentView === 'landing') {
    return (
      <main ref={mainContentRef} className="h-screen overflow-y-auto scroll-smooth">
        <div key={currentView} className="animate-fade-in-up">
          {renderView()}
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile unless toggled */}
      <div className={`fixed top-0 left-0 lg:static z-40 h-full transform transition-transform duration-300 ease-in-out lg:transform-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          currentView={currentView}
          setView={(view) => { setCurrentView(view); setMobileMenuOpen(false); }}
          role={role}
          setRole={setRole}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-xl font-bold text-gray-800 hidden sm:block">{getPageTitle()}</h2>
            <h2 className="text-lg font-bold text-gray-800 sm:hidden">{getPageTitle() === 'Overview' ? 'EscrowChain-Alliance' : getPageTitle()}</h2>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1 sm:mx-2"></div>
            <WalletConnect wallet={wallet} setWallet={setWallet} />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">
            <div key={currentView} className="animate-fade-in-up">
              {renderView()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;