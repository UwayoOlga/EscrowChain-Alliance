import React, { useState } from 'react';
import { Property, WalletState } from '../types';
import { CheckCircle, Lock, ArrowRight, AlertTriangle } from 'lucide-react';

interface PaymentProps {
  properties: Property[];
  wallet: WalletState;
}

const Payment: React.FC<PaymentProps> = ({ properties, wallet }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) {
      alert("Please connect your wallet first.");
      return;
    }
    
    setStatus('processing');
    
    // Simulate smart contract interaction
    setTimeout(() => {
      setStatus('success');
      setAmount('');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Make a Payment</h2>
        <p className="text-gray-500">Securely deposit your rent into the blockchain escrow smart contract.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            {status === 'success' ? (
              <div className="text-center py-10 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Locked in Escrow</h3>
                <p className="text-gray-500 mb-6 px-4">Your rent has been securely deposited. It will be released to the landlord once conditions are met.</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  Make Another Payment
                </button>
              </div>
            ) : (
              <form onSubmit={handlePayment} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Property</label>
                  <select 
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.address}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rent Amount (ADA)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={selectedProperty ? `${selectedProperty.rentAmount}` : '0.00'}
                      className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute left-3 top-3.5 text-gray-400 font-bold">₳</div>
                  </div>
                  {selectedProperty && (
                    <p className="mt-1 text-xs text-gray-500">Contract Monthly Rent: {selectedProperty.rentAmount} ₳</p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start space-x-3">
                  <Lock className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm text-blue-800">
                    Funds are held in a secure <strong>Smart Contract</strong>. The landlord cannot withdraw until property conditions are verified for the month.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!wallet.connected || status === 'processing'}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all flex items-center justify-center space-x-2
                    ${!wallet.connected ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}
                  `}
                >
                  {status === 'processing' ? (
                     <span>Processing Transaction...</span>
                  ) : (
                    <>
                      <span>Deposit Rent</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                
                {!wallet.connected && (
                  <p className="text-center text-sm text-red-500 flex items-center justify-center gap-1">
                    <AlertTriangle size={14} />
                    Connect wallet to proceed
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Info Side Panel */}
        <div className="space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-semibold text-gray-900 mb-4">Transaction Summary</h3>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Recipient</span>
                  <span className="font-medium text-gray-900 truncate max-w-[120px]">{selectedProperty?.landlord || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network Fee</span>
                  <span className="font-medium text-gray-900">0.17 ₳</span>
                </div>
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span className="text-gray-900 font-bold">Total</span>
                  <span className="text-blue-600 font-bold">
                    {amount ? (parseFloat(amount) + 0.17).toFixed(2) : '0.00'} ₳
                  </span>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-6 rounded-xl shadow-md text-white">
            <h3 className="font-bold mb-2">Escrow Guarantee</h3>
            <p className="text-sm text-green-100 mb-4">
              Your funds are protected by the BlockRent Safety Protocol. 
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-300 flex-shrink-0" />
                <span>Smart Contract Locked</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-300 flex-shrink-0" />
                <span>Dispute Protection</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-300 flex-shrink-0" />
                <span>Instant Receipts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;