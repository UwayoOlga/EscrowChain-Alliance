import React from 'react';
import { MOCK_TRANSACTIONS } from '../constants';
import { Users, Activity, FileText } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">System Administration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">1,248</h3>
               </div>
               <Users className="text-purple-500" size={24} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-indigo-500">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-medium text-gray-500">Transactions Vol (24h)</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">45k ₳</h3>
               </div>
               <Activity className="text-indigo-500" size={24} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-pink-500">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-medium text-gray-500">Smart Contracts</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">856</h3>
               </div>
               <FileText className="text-pink-500" size={24} />
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent System Logs</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                     <th className="px-6 py-3">Transaction ID</th>
                     <th className="px-6 py-3">Type</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3">Date</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {MOCK_TRANSACTIONS.map((tx) => (
                     <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-gray-900">{tx.id}</td>
                        <td className="px-6 py-4">Rent Payment</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                              tx.status === 'locked' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                           }`}>
                              {tx.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
