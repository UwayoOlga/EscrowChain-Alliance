import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UserRole, Transaction, Property } from '../types';
import { MOCK_TRANSACTIONS, CHART_DATA_PAYMENTS, CHART_DATA_DISPUTES, MOCK_DISPUTES, MOCK_PROPERTIES } from '../constants';
import { DollarSign, ShieldCheck, AlertCircle, Clock } from 'lucide-react';

interface DashboardProps {
  role: UserRole;
  userProperties: Property[];
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const Dashboard: React.FC<DashboardProps> = ({ role, userProperties }) => {
  const lockedRent = MOCK_TRANSACTIONS.filter(t => t.status === 'locked').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = (userProperties || []).filter(p => (p as any).conditionStatus !== 'fully_approved').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full flex-shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Locked</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{lockedRent} ₳</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Contracts</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{userProperties.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-full flex-shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-full flex-shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Disputes</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{MOCK_DISPUTES.filter(d => d.status === 'open').length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History (6M)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA_PAYMENTS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {MOCK_TRANSACTIONS.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.status === 'completed' ? 'bg-green-500' : tx.status === 'locked' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{tx.property.split(',')[0]}</p>
                    <p className="text-xs text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{tx.amount} ₳</p>
                  <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
            View All Transactions
          </button>
        </div>
      </div>

      {/* Dispute Visualization (Admin/Landlord relevant) */}
      {(role === 'admin' || role === 'landlord') && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dispute Resolution Stats</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center h-auto sm:h-64">
            <div className="w-full h-64 sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CHART_DATA_DISPUTES}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {CHART_DATA_DISPUTES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-8 grid grid-cols-3 sm:grid-cols-1 gap-4 sm:gap-2">
              {CHART_DATA_DISPUTES.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;