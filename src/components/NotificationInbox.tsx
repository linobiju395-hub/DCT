import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, AlertTriangle, AlertCircle, ShieldAlert, CheckCircle2, Mail } from 'lucide-react';
import { useDomains } from '../context/DomainContext';
import { NotificationItem } from '../types/domain';

export const NotificationInbox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'downtime' | 'expiry' | 'email'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications } = useDomains();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'downtime') return item.type === 'downtime_error';
    if (filter === 'expiry') return item.type.startsWith('expiry');
    if (filter === 'email') return item.channel === 'email' || item.type === 'email_renewal_30d';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'email_renewal_30d':
        return <Mail className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'downtime_error':
        return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'expiry_30d':
      case 'expiry_repeating':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'ssl_warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />;
      case 'recovered':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors focus:outline-none"
        title="Notification Inbox"
        aria-label="Notification alerts"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full tabular-nums">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#10121a] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Notification Inbox</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-zinc-400 hover:text-rose-600 p-1 transition-colors"
                  title="Clear all alerts"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1 p-2 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800/80 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('downtime')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'downtime'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Downtime
            </button>
            <button
              onClick={() => setFilter('expiry')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'expiry'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Expiry (&lt;30d)
            </button>
            <button
              onClick={() => setFilter('email')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'email'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Emails
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium text-zinc-700 dark:text-zinc-300">All alerts cleared</p>
                <p className="mt-1">All services are operating within normal parameters.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-3 text-xs transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 flex items-start gap-2.5 ${
                    !notif.read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{notif.title}</span>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-mono tabular-nums">
                        {new Date(notif.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        notif.recipient_type === 'client'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {notif.recipient}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">{notif.domain_name}</span>
                      {notif.renewal_url && (
                        <a
                          href={notif.renewal_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                        >
                          <span>Renew ↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-zinc-50 dark:bg-zinc-950/70 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 text-center">
            Synced with Telegram Alerts & Internal Cron
          </div>
        </div>
      )}
    </div>
  );
};
