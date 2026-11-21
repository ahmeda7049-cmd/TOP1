import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-5 left-4 z-50 flex items-center gap-2 rounded-full bg-[#0F172A] border border-amber-400/50 px-4 py-2 text-xs font-display font-bold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 text-[#FFD93D] shrink-0" aria-hidden="true" />
      <span>وضع عدم الاتصال · الدروس المحفوظة شغالة</span>
    </div>
  );
};
