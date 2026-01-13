import React from 'react';
import { LayoutDashboard, CreditCard, Home, ShieldAlert, Settings, LogOut, Hexagon } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, role, setRole }) => {
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
        <div className="bg-blue-600 p-2 rounded-lg">
          <Hexagon size={24} fill="white" className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">BlockRent</h1>
          <p className="text-xs text-slate-400">Escrow Protocol</p>
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

        <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;