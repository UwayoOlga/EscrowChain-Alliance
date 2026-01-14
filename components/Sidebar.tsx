import React from 'react';
import { LayoutDashboard, CreditCard, Home, ShieldAlert, Settings, LogOut, Hexagon } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: any;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, role, setRole, user, onLogout }) => {
  const menuItems = [
    { id: 'landing', label: 'Home', icon: <Home size={20} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'payment', label: 'Payments', icon: <CreditCard size={20} /> },
    { id: 'property', label: 'Properties', icon: <Home size={20} /> },
    { id: 'dispute', label: 'Disputes', icon: <ShieldAlert size={20} /> },
  ];

  if (role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: <Settings size={20} /> });
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full overflow-y-auto transition-all duration-300 border-r border-slate-800">
      <div className="p-6 flex items-center space-x-3 text-white border-b border-slate-800 flex-shrink-0">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <Hexagon size={24} fill="white" className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-tight text-white italic">ESCROWCHAIN<span className="text-blue-600">ALLIANCE</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Escrow Protocol</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === item.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
              : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 flex-shrink-0">
        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Simulate Role</p>
          <div className="flex bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => setRole('tenant')}
              className={`flex-1 text-xs py-1 rounded ${role === 'tenant' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Tenant
            </button>
            <button
              onClick={() => setRole('landlord')}
              className={`flex-1 text-xs py-1 rounded ${role === 'landlord' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Landlord
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-xl mb-4 border border-slate-700/50">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || 'N/A'}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="font-bold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;