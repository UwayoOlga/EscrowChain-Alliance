import React, { useState } from 'react';
import { Property, UserRole } from '../types';
import { Camera, Check, Upload, Home, Hammer, AlertTriangle, XCircle } from 'lucide-react';

interface PropertyStatusProps {
   properties: Property[];
   role: UserRole;
}

const PropertyStatus: React.FC<PropertyStatusProps> = ({ properties, role }) => {
   const [activeProperty, setActiveProperty] = useState<string>(properties[0]?.id || '');
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [showSuccess, setShowSuccess] = useState(false);
   const [checklist, setChecklist] = useState({
      plumbing: true,
      electricity: true,
      hvac: false
   });

   const currentProp = properties.find(p => p.id === activeProperty);

   const getStatusBadge = (status: string) => {
      switch (status) {
         case 'fully_approved': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 whitespace-nowrap">Ready for Payout</span>;
         case 'pending_review': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 whitespace-nowrap">Pending Review</span>;
         default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 whitespace-nowrap">{status.replace('_', ' ')}</span>;
      }
   };

   const handleConfirm = () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
   };

   return (
      <div className="max-w-5xl mx-auto space-y-8">
         {showSuccess && (
            <div className="fixed top-20 right-8 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-[60] animate-bounce flex items-center gap-3">
               <Check size={24} />
               <p className="font-bold text-lg">Property Condition Confirmed!</p>
            </div>
         )}

         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div>
               <h2 className="text-2xl font-bold text-gray-900">Property Readiness</h2>
               <p className="text-gray-500">Verify property condition to release escrow funds.</p>
            </div>
            {role === 'landlord' && (
               <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
               >
                  <Home size={16} /> Add Property
               </button>
            )}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-700">Your Properties</h3>
               </div>
               <div className="divide-y divide-gray-100">
                  {properties.map(p => (
                     <div
                        key={p.id}
                        onClick={() => setActiveProperty(p.id)}
                        className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${activeProperty === p.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'pl-4'}`}
                     >
                        <div className="flex justify-between items-start mb-1">
                           <span className="font-medium text-gray-900 truncate pr-2">{p.address}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-between items-center mt-2">
                           <span className="text-xs text-gray-500">{p.rentAmount} ₳ / mo</span>
                           {getStatusBadge(p.conditionStatus)}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Details Area */}
            <div className="lg:col-span-2 space-y-6">
               {currentProp ? (
                  <>
                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2 sm:gap-0">
                           <h3 className="text-xl font-bold text-gray-900">Condition Report: Oct 2023</h3>
                           <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">ID: {currentProp.id}</span>
                        </div>

                        <div className="space-y-6">
                           <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                 <Camera size={24} />
                              </div>
                              <h4 className="font-medium text-gray-900">Upload Evidence</h4>
                              <p className="text-sm text-gray-500 mt-1 max-w-xs">Upload photos or videos of the property condition (Required for monthly release).</p>
                              <button className="mt-4 text-blue-600 text-sm font-medium flex items-center">
                                 <Upload size={14} className="mr-1" /> Browse Files
                              </button>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <img src="https://picsum.photos/400/300" alt="Living Room" className="rounded-lg object-cover h-40 w-full hover:opacity-90 transition-opacity cursor-pointer shadow-sm" />
                              <img src="https://picsum.photos/401/300" alt="Kitchen" className="rounded-lg object-cover h-40 w-full hover:opacity-90 transition-opacity cursor-pointer shadow-sm" />
                           </div>

                           <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Checklist</h4>
                              <div className="space-y-2">
                                 <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer p-1 hover:bg-gray-100 rounded">
                                    <input
                                       type="checkbox"
                                       checked={checklist.plumbing}
                                       onChange={(e) => setChecklist({ ...checklist, plumbing: e.target.checked })}
                                       className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <span>No major plumbing issues</span>
                                 </label>
                                 <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer p-1 hover:bg-gray-100 rounded">
                                    <input
                                       type="checkbox"
                                       checked={checklist.electricity}
                                       onChange={(e) => setChecklist({ ...checklist, electricity: e.target.checked })}
                                       className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <span>Electricity fully functional</span>
                                 </label>
                                 <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer p-1 hover:bg-gray-100 rounded">
                                    <input
                                       type="checkbox"
                                       checked={checklist.hvac}
                                       onChange={(e) => setChecklist({ ...checklist, hvac: e.target.checked })}
                                       className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <span>HVAC system operational</span>
                                 </label>
                              </div>
                           </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                           <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center justify-center">
                              <Hammer size={16} className="mr-2" /> Report Issue
                           </button>
                           <button
                              onClick={handleConfirm}
                              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm shadow-sm flex items-center justify-center"
                           >
                              <Check size={16} className="mr-2" /> Confirm Readiness
                           </button>
                        </div>
                     </div>
                  </>
               ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8">
                     Select a property to view details
                  </div>
               )}
            </div>
         </div>

         {/* Add Property Modal */}
         {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
               <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden p-8 animate-scale-in">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-2xl font-bold text-slate-900 italic">ADD <span className="text-blue-600">PROPERTY</span></h3>
                     <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900"><XCircle size={24} /></button>
                  </div>
                  <form className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">Property Address</label>
                        <input type="text" placeholder="e.g. 123 Blockchain Ave" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-semibold" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">Rent (₳)</label>
                           <input type="number" placeholder="1200" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-semibold" />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">Deposit (₳)</label>
                           <input type="number" placeholder="1800" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-semibold" />
                        </div>
                     </div>
                     <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-4">
                        List Property
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default PropertyStatus;