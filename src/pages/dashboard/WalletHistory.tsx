import { useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import type { WalletHistoryEntry } from '@/types/wallet';
import { useToastStore } from '@/store/toastStore';
import { ArrowDownRight, ArrowUpRight, Clock, Gift, PackageOpen, RefreshCw, Wallet, Zap } from 'lucide-react';

interface WalletHistoryProps {
  embedded?: boolean;
}

export default function WalletHistory({ embedded = false }: WalletHistoryProps) {
  const { showToast } = useToastStore();
  const [entries, setEntries] = useState<WalletHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await authService.getWalletHistory(50, 0);
        setEntries(res?.items || []);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch wallet history';
        console.error(errorMsg, err);
        showToast(errorMsg, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [showToast]);

  const filteredEntries = filterCategory === 'all' 
    ? entries 
    : entries.filter(e => e.category === filterCategory);

  const getIconForCategory = (category: string, direction: 'credit' | 'debit') => {
    switch (category) {
      case 'charge': return <Zap className="w-4 h-4 text-orange-500" />;
      case 'reward': return <Gift className="w-4 h-4 text-purple-500" />;
      case 'redeem': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'commission': return <Wallet className="w-4 h-4 text-green-500" />;
      case 'expiration': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'recharge': return <PackageOpen className="w-4 h-4 text-primary-500" />;
      default: return direction === 'credit' ? <ArrowDownRight className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />;
    }
  };

  const getBgColorForCategory = (category: string) => {
    switch (category) {
      case 'charge': return 'bg-orange-500/10';
      case 'reward': return 'bg-purple-500/10';
      case 'redeem': return 'bg-blue-500/10';
      case 'commission': return 'bg-green-500/10';
      case 'expiration': return 'bg-gray-500/10';
      case 'recharge': return 'bg-primary-500/10';
      default: return 'bg-white/5';
    }
  };

  const formatEntryAmount = (entry: WalletHistoryEntry) => {
    const prefix = entry.direction === 'credit' ? '+' : entry.direction === 'debit' ? '-' : '';
    if (entry.asset_code === 'MENU_CASH') {
      return `${prefix}¥${(entry.amount / 100).toLocaleString()}`;
    }
    if (entry.asset_code === 'menu.render.call') {
      return `${prefix}${entry.amount} quota`;
    }
    if (entry.asset_code === 'MENU_CREDIT' || entry.asset_code === 'MENU_PROMO_CREDIT') {
      return `${prefix}${entry.amount} credits`;
    }
    return `${prefix}${entry.amount}`;
  };

  const formatEntryAssetLabel = (entry: WalletHistoryEntry) => {
    switch (entry.asset_code) {
      case 'MENU_CASH':
        return 'Cash Balance';
      case 'menu.render.call':
        return 'Menu Quota';
      case 'MENU_CREDIT':
        return 'Permanent Credits';
      case 'MENU_PROMO_CREDIT':
        return 'Promo Credits';
      default:
        return entry.asset_code || entry.currency || entry.charge_mode || 'activity';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin"></div>
          <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full animate-pulse-glow"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'animate-slide-up'}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!embedded && <h1 className="text-2xl font-black text-white">Billing History</h1>}
          <p className="text-sm text-gray-400">See rewards, redemptions, expirations and Studio charge outcomes in one place.</p>
        </div>
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="all">All Activity</option>
          <option value="charge">Studio Consumption</option>
          <option value="reward">Rewards</option>
          <option value="redeem">Redemptions</option>
          <option value="commission">Commissions</option>
          <option value="recharge">Top-ups</option>
          <option value="expiration">Expirations</option>
        </select>
      </div>

      <div className="glass rounded-xl p-6">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">📜</div>
            <p className="text-sm text-gray-500">No billing activity found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry, idx) => (
              <div 
                key={entry.id} 
                className="group relative flex gap-4 p-5 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/5 animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner ${getBgColorForCategory(entry.category)}`}>
                  {getIconForCategory(entry.category, entry.direction)}
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-white tracking-wide">{entry.title}</p>
                      {entry.flow_status && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-primary-300 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full">
                          {entry.flow_status}
                        </span>
                      )}
                    </div>
                    
                    {entry.category === 'charge' && entry.job_id && (
                      <p className="text-xs text-white/40 mt-1.5 font-mono bg-black/40 px-2 py-0.5 rounded inline-block border border-white/5">
                        ID: {entry.job_id.slice(0, 8)}...
                      </p>
                    )}

                    {entry.description && (
                      <p className="mt-2 text-xs text-gray-500">{entry.description}</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(entry.occurred_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className={`text-right ${entry.direction === 'credit' ? 'text-green-400' : 'text-orange-400'}`}>
                    <p className={`font-black text-2xl tracking-tight drop-shadow-md ${entry.direction === 'credit' ? 'shadow-green-500/20' : 'shadow-orange-500/20'}`}>
                      {formatEntryAmount(entry)}
                    </p>
                    <p className="text-[11px] opacity-60 uppercase tracking-widest font-bold mt-1">
                      {formatEntryAssetLabel(entry)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
