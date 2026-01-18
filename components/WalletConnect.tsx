import React from 'react';
import { Wallet, XCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@meshsdk/react';
import { WalletState } from '../types';

interface WalletConnectProps {
  wallet: WalletState;
  setWallet: (wallet: WalletState) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ wallet, setWallet }) => {
  const { connect, disconnect, connecting, connected, name, wallet: meshWallet } = useWallet();

  // Sync MeshSDK state with our App state
  React.useEffect(() => {
    const syncWallet = async () => {
      if (connected && meshWallet) {
        try {
          const address = await meshWallet.getChangeAddress();
          const balanceLovelace = await meshWallet.getLovelace();
          const balanceAda = parseFloat(balanceLovelace) / 1000000;

          setWallet({
            connected: true,
            address,
            balance: balanceAda,
            provider: name as any,
          });
        } catch (error) {
          console.error("Failed to sync wallet details:", error);
        }
      } else {
        setWallet({
          connected: false,
          address: null,
          balance: 0,
          provider: null,
        });
      }
    };
    syncWallet();
  }, [connected, name, meshWallet, setWallet]);

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <div className="relative">
      {!connected ? (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={connecting}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
          >
            {connecting ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
            <span className="hidden sm:inline">{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-5">
              <h3 className="text-gray-900 font-semibold mb-3">Select Wallet</h3>
              <div className="space-y-2">
                {['Nami', 'Eternl', 'Lace', 'Vespr'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      connect(p.toLowerCase());
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between group transition-colors"
                  >
                    <span className="font-medium text-gray-700">{p}</span>
                    <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-green-500"></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-3 bg-white border border-green-200 px-3 sm:px-4 py-2 rounded-lg shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-wide uppercase truncate max-w-[100px]">{name} Connected</span>
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