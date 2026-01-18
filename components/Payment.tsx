import React, { useState } from 'react';
import { Property, WalletState } from '../types';
import { CheckCircle, Lock, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';

interface PaymentProps {
  properties: Property[];
  wallet: WalletState;
}

const Payment: React.FC<PaymentProps> = ({ properties, wallet }) => {
  const { wallet: meshWallet, connected } = useWallet();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !meshWallet) {
      setError("Please connect your wallet first.");
      return;
    }

    setStatus('processing');
    setError('');

    try {
      // Aiken Escrow Datum Structure:
      // { landlord: VerificationKeyHash, tenant: VerificationKeyHash, rent_amount: Int, deposit_amount: Int }

      const rentAmountAda = parseFloat(amount || (selectedProperty?.rentAmount?.toString() || '0'));
      const rentAmountLovelace = Math.floor(rentAmountAda * 1000000);

      // For demo, we'll use the current wallet as tenant and a fixed landlord hash
      // In production, these hashes would be fetched from the backend property details
      const tenantHash = (await meshWallet.getUsedAddresses())[0]; // Simplified for demo
      const landlordHash = "682173516515206584c3c3e800d9241b7117f7d188043640b3c6751c";

      const datum = {
        value: {
          alternative: 0,
          fields: [
            landlordHash,
            tenantHash,
            rentAmountLovelace,
            Math.floor(rentAmountLovelace * 1.5) // Auto-calculate hypothetical deposit
          ]
        },
        inline: true
      };

      const tx = new Transaction({ initiator: meshWallet });
      tx.sendLovelace(
        {
          address: 'addr_test1wpnlxv6xv9npuevznstaja8c0m67n5p9u4m8f24xv3y53ts9v604u', // Hypothetical Aiken Script Address
          datum: datum
        },
        rentAmountLovelace.toString()
      );

      const unsignedTx = await tx.build();
      const signedTx = await meshWallet.signTx(unsignedTx);
      const hash = await meshWallet.submitTx(signedTx);

      setTxHash(hash);
      setStatus('success');
      setAmount('');
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err.request?.data?.message || err.message || "Transaction failed. Please try again.");
      setStatus('error');
    }
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
                <p className="text-gray-500 mb-2 px-4">Your rent has been securely deposited.</p>
                <p className="text-xs text-blue-600 font-mono mb-6 break-all px-10">Tx: {txHash}</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  Make Another Payment
                </button>
              </div>
            ) : (
              <form onSubmit={handlePayment} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm font-medium animate-shake">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

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
                  disabled={!connected || status === 'processing'}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all flex items-center justify-center space-x-2
                    ${!connected ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}
                  `}
                >
                  {status === 'processing' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span>Confirming on Cardano...</span>
                    </div>
                  ) : (
                    <>
                      <span>Deposit Rent</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {!connected && (
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
                <span className="font-medium text-gray-900">~0.17 ₳</span>
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
              Your funds are protected by the EscrowChain Safety Protocol.
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-300 flex-shrink-0" />
                <span>Aiken Smart Contract</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-300 flex-shrink-0" />
                <span>Multi-sig Protection</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-300 flex-shrink-0" />
                <span>On-chain Immutability</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;