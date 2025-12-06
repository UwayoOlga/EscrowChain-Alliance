import React, { useState } from 'react';
import { Wallet, CheckCircle, XCircle } from 'lucide-react';
import { WalletState } from '../types';

interface WalletConnectProps {
  wallet: WalletState;
  setWallet: (wallet: WalletState) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ wallet, setWallet }) => {
  const [isOpen, setIsOpen] = useState(false);

  const connect = (provider: 'Nami' | 'Eternl' | 'Lace') => {
    // Simulate connection delay
    setTimeout(() => {
      setWallet({
        connected: true,
        address: 'addr1qxy...9z4a',
        balance: 4500.25,
        provider: provider,
      });
      setIsOpen(false);
    }, 800);
  };

  const disconnect = () => {
    setWallet({
      connected: false,
      address: null,
      balance: 0,
      provider: null,
    });
  };

  return (
    <div className="relative">
      {!wallet.connected ? (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            aria-label="Connect Wallet"
          >
            <Wallet size={18} />
            <span className="hidden sm:inline">Connect Wallet</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-5">
              <h3 className="text-gray-900 font-semibold mb-3">Select Wallet</h3>
              <div className="space-y-2">
                {['Nami', 'Eternl', 'Lace'].map((provider) => (
                  <button
                    key={provider}
                    onClick={() => connect(provider as any)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between group transition-colors"
                  >
                    <span className="font-medium text-gray-700">{provider}</span>
                    <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-green-500"></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center space-x-3 bg-white border border-green-200 px-3 sm:px-4 py-2 rounded-lg shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-wide uppercase">{wallet.provider} <span className="hidden sm:inline">Connected</span></span>
            <span className="text-sm font-bold text-gray-800">{wallet.balance.toLocaleString()} ₳</span>
          </div>
          <button onClick={disconnect} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Disconnect">
            <XCircle size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;