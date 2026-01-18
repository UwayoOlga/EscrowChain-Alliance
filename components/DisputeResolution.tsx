import React, { useState } from 'react';
import { Dispute, UserRole } from '../types';
import { MOCK_DISPUTES } from '../constants';
import { MessageSquare, FileText, Send, AlertOctagon, Upload } from 'lucide-react';

interface DisputeProps {
  role: UserRole;
}

const DisputeResolution: React.FC<DisputeProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'active'>('active');
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    property: '123 Blockchain Blvd',
    category: 'Maintenance Not Completed',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDispute: Dispute = {
      id: `DISP-${Math.floor(Math.random() * 10000)}`,
      propertyId: formData.property === '123 Blockchain Blvd' ? 'PROP-001' : 'PROP-002',
      issue: formData.category,
      status: 'open',
      raisedBy: 'Current User',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setDisputes([newDispute, ...disputes]);
    setFormData({ ...formData, description: '' });
    setActiveTab('active');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispute Center</h2>
          <p className="text-gray-500">Fair and transparent resolution powered by decentralized arbitration.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 sm:flex-none text-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Active Cases
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 sm:flex-none text-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            New Dispute
          </button>
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-4">
          {disputes.length > 0 ? disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2 sm:gap-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${dispute.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{dispute.status}</span>
                    <span className="text-sm text-gray-400">#{dispute.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{dispute.issue}</h3>
                  <p className="text-sm text-gray-500 mt-1">Property ID: <span className="font-mono bg-gray-100 px-1 rounded">{dispute.propertyId}</span></p>
                </div>
                <div className="text-left sm:text-right text-sm text-gray-500">
                  <p>Raised by: {dispute.raisedBy}</p>
                  <p>{dispute.date}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-xs">
                    ARB
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Arbitrator Bot</p>
                    <p className="text-sm text-gray-600 mt-1">Evidence has been submitted by both parties. Pending neutral review. Expected resolution: 48 hours.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => { setSelectedDispute(dispute); setIsEvidenceModalOpen(true); }}
                  className="w-full sm:w-auto text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center px-3 py-2 border border-gray-200 sm:border-transparent rounded-lg sm:rounded-none"
                >
                  <FileText size={16} className="mr-2" /> View Evidence
                </button>
                <button
                  onClick={() => { setSelectedDispute(dispute); setIsRespondModalOpen(true); }}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <MessageSquare size={16} className="mr-2" /> Respond
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <AlertOctagon size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No active disputes</h3>
              <p className="text-gray-500">Great! All your contracts are running smoothly.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Property</label>
              <select
                value={formData.property}
                onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>123 Blockchain Blvd</option>
                <option>456 Satoshi Street</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Maintenance Not Completed</option>
                <option>Funds Not Released</option>
                <option>Property Damage</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the issue in detail..."
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Upload</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <span className="text-sm text-blue-600 font-medium">Click to upload files</span>
                <span className="text-sm text-gray-500"> or drag and drop</span>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-0">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className="w-full sm:w-auto mr-0 sm:mr-3 px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors text-center"
              >
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-auto bg-red-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md flex items-center justify-center">
                <Send size={16} className="mr-2" /> Submit Dispute
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Respond Modal */}
      {isRespondModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRespondModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Respond to Dispute</h3>
            <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-50 p-2 rounded">Case ID: {selectedDispute?.id}</p>
            <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-slate-50 mb-4 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Your formal response..." />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsRespondModalOpen(false)} className="px-6 py-2 text-gray-600 font-bold">Cancel</button>
              <button className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-blue-700">Send Response</button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {isEvidenceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEvidenceModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 pointer-events-auto">
            <h3 className="text-2xl font-bold mb-6">Case Evidence</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold border-2 border-dashed">No Evidence Loaded</div>
              <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold border-2 border-dashed">No Evidence Loaded</div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setIsEvidenceModalOpen(false)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeResolution;