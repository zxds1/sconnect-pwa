import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, Filter, Mail, MessageCircle, Phone, RefreshCcw, Settings2, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  createNotificationFilter,
  deleteNotificationFilter,
  getNotificationChannels,
  getNotificationPreferences,
  listNotificationFilters,
  listNotifications,
  markNotificationRead,
  updateNotification,
  updateNotificationChannels,
  updateNotificationFilter,
  updateNotificationPreferences,
  type NotificationChannels,
  type NotificationFilter,
  type NotificationItem,
  type NotificationListResponse,
  type NotificationPreferences
} from '../lib/notificationsApi';

interface NotificationsProps {
  onBack: () => void;
}

type TabKey = 'inbox' | 'preferences' | 'channels' | 'filters';

export const Notifications: React.FC<NotificationsProps> = ({ onBack }) => {
  const [tab, setTab] = useState<TabKey>('inbox');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [channels, setChannels] = useState<NotificationChannels>({});
  const [filters, setFilters] = useState<NotificationFilter[]>([]);
  const [creatingFilter, setCreatingFilter] = useState(false);
  const [newFilter, setNewFilter] = useState({ name: '', channel: 'push', frequency: 'instant', active: true, rules: '[]' });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [inboxResp, prefResp, channelResp, filterResp] = await Promise.all([
          listNotifications(),
          getNotificationPreferences(),
          getNotificationChannels(),
          listNotificationFilters()
        ]);
        if (!alive) return;
        const inboxItems = (inboxResp as NotificationListResponse)?.items ?? [];
        setNotifications(inboxItems);
        setUnreadCount((inboxResp as NotificationListResponse)?.unread_count ?? null);
        setPreferences(prefResp || {});
        setChannels(channelResp || {});
        setFilters(filterResp || []);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || 'Unable to load notifications.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const computedUnread = useMemo(() => notifications.filter(n => n.status !== 'read').length, [notifications]);
  const displayUnread = unreadCount ?? computedUnread;

  const filteredNotifications = useMemo(() => {
    if (typeFilter === 'all') return notifications;
    return notifications.filter((note) => (note.type || 'unknown') === typeFilter);
  }, [notifications, typeFilter]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
      setUnreadCount(null);
    } catch (err: any) {
      setError(err?.message || 'Unable to mark as read.');
    }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    try {
      const next = status === 'read' ? 'unread' : 'read';
      await updateNotification(id, { status: next });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: next } : n));
      setUnreadCount(null);
    } catch (err: any) {
      setError(err?.message || 'Unable to update notification.');
    }
  };

  const updatePrefs = async (next: NotificationPreferences) => {
    setPreferences(next);
    try {
      await updateNotificationPreferences(next);
    } catch (err: any) {
      setError(err?.message || 'Unable to update preferences.');
    }
  };

  const updateChans = async (next: NotificationChannels) => {
    setChannels(next);
    try {
      await updateNotificationChannels(next);
    } catch (err: any) {
      setError(err?.message || 'Unable to update channels.');
    }
  };

  const handleCreateFilter = async () => {
    if (!newFilter.name.trim()) return;
    setCreatingFilter(true);
    try {
      const parsedRules = JSON.parse(newFilter.rules || '[]');
      const created = await createNotificationFilter({
        name: newFilter.name.trim(),
        channel: newFilter.channel,
        frequency: newFilter.frequency,
        active: newFilter.active,
        rules: Array.isArray(parsedRules) ? parsedRules : []
      });
      setFilters(prev => [...prev, created as NotificationFilter]);
      setNewFilter({ name: '', channel: 'push', frequency: 'instant', active: true, rules: '[]' });
    } catch (err: any) {
      setError(err?.message || 'Unable to create filter.');
    } finally {
      setCreatingFilter(false);
    }
  };

  const handleToggleFilter = async (filter: NotificationFilter) => {
    const nextActive = !filter.active;
    setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, active: nextActive } : f));
    try {
      await updateNotificationFilter(filter.id, { active: nextActive });
    } catch (err: any) {
      setError(err?.message || 'Unable to update filter.');
    }
  };

  const handleDeleteFilter = async (id: string) => {
    try {
      await deleteNotificationFilter(id);
      setFilters(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Unable to delete filter.');
    }
  };

  return (
    <div className="h-full bg-zinc-50 flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-4 bg-white border-b border-zinc-100 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-black">Notifications</p>
            <p className="text-[10px] text-zinc-500">{displayUnread} unread</p>
          </div>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            Promise.all([
              listNotifications(),
              getNotificationPreferences(),
              getNotificationChannels(),
              listNotificationFilters()
            ])
              .then(([inboxResp, prefResp, channelResp, filterResp]) => {
                const inboxItems = (inboxResp as NotificationListResponse)?.items ?? [];
                setNotifications(inboxItems);
                setUnreadCount((inboxResp as NotificationListResponse)?.unread_count ?? null);
                setPreferences(prefResp || {});
                setChannels(channelResp || {});
                setFilters(filterResp || []);
              })
              .catch((err: any) => setError(err?.message || 'Unable to refresh.'))
              .finally(() => setLoading(false));
          }}
          className="p-2 rounded-full hover:bg-zinc-100"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pt-4">
        <div className="flex gap-2 text-[10px] font-bold">
          {([
            { key: 'inbox', label: 'Inbox', icon: Bell },
            { key: 'preferences', label: 'Preferences', icon: Settings2 },
            { key: 'channels', label: 'Channels', icon: MessageCircle },
            { key: 'filters', label: 'Filters', icon: Filter }
          ] as const).map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`px-3 py-2 rounded-xl border ${tab === item.key ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200'}`}
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-3 h-3" /> {item.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-[11px] font-bold rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 text-[11px] font-bold text-zinc-500">
            Loading notifications...
          </div>
        )}

        {!loading && tab === 'inbox' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center gap-3">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 p-2 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700"
              >
                <option value="all">All types</option>
                {Array.from(new Set(notifications.map((note) => note.type || 'unknown'))).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-100 p-6 text-center text-[11px] font-bold text-zinc-500">
                You have no notifications yet.
              </div>
            ) : (
              filteredNotifications.map(note => (
                <div key={note.id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${note.status === 'read' ? 'bg-zinc-100 text-zinc-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-900">{note.title || 'Notification'}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{note.body}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleMarkRead(note.id)}
                        className="text-[10px] font-bold text-emerald-600"
                      >
                        Mark read
                      </button>
                      <button
                        onClick={() => handleToggleStatus(note.id, note.status || 'unread')}
                        className="text-[10px] font-bold text-zinc-500"
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-400">{note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}</span>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && tab === 'preferences' && (
          <div className="space-y-3">
            {([
              ['price_drops', 'Price drops'],
              ['back_in_stock', 'Back in stock'],
              ['trending', 'Trending'],
              ['marketing', 'Marketing'],
              ['rewards', 'Rewards'],
              ['support', 'Support'],
              ['system', 'System'],
              ['watched_items', 'Watched items'],
              ['location_based', 'Location based']
            ] as const).map(([key, label]) => (
              <div key={key} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-900">{label}</p>
                  <p className="text-[10px] text-zinc-500">Control notifications for {label.toLowerCase()}.</p>
                </div>
                <button
                  onClick={() => updatePrefs({ ...preferences, [key]: !preferences[key] })}
                  className="p-1 rounded-full"
                >
                  {preferences[key] ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
                </button>
              </div>
            ))}
            <div className="bg-white rounded-2xl border border-zinc-100 p-4">
              <p className="text-sm font-bold text-zinc-900">Frequency</p>
              <select
                value={preferences.frequency || 'instant'}
                onChange={(e) => updatePrefs({ ...preferences, frequency: e.target.value })}
                className="mt-2 w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-4">
              <p className="text-sm font-bold text-zinc-900">Quiet Hours</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                  placeholder="Start (HH:MM)"
                  value={preferences.quiet_hours_start || ''}
                  onChange={(e) => updatePrefs({ ...preferences, quiet_hours_start: e.target.value })}
                />
                <input
                  className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                  placeholder="End (HH:MM)"
                  value={preferences.quiet_hours_end || ''}
                  onChange={(e) => updatePrefs({ ...preferences, quiet_hours_end: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {!loading && tab === 'channels' && (
          <div className="space-y-3">
            {([
              ['push', 'Push', Bell],
              ['whatsapp', 'WhatsApp', MessageCircle],
              ['sms', 'SMS', Phone],
              ['email', 'Email', Mail]
            ] as const).map(([key, label, Icon]) => (
              <div key={key} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 rounded-xl">
                    <Icon className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{label}</p>
                    <p className="text-[10px] text-zinc-500">Enable {label.toLowerCase()} notifications.</p>
                  </div>
                </div>
                <button
                  onClick={() => updateChans({ ...channels, [key]: !channels[key] })}
                  className="p-1 rounded-full"
                >
                  {channels[key] ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'filters' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-100 p-4">
              <p className="text-sm font-bold text-zinc-900">Create Filter</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <input
                  value={newFilter.name}
                  onChange={(e) => setNewFilter(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Filter name"
                  className="p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                />
                <textarea
                  value={newFilter.rules}
                  onChange={(e) => setNewFilter(prev => ({ ...prev, rules: e.target.value }))}
                  placeholder='Rules JSON (e.g. [{"event":"price_drop","channels":["push"],"allow":true}])'
                  className="p-3 bg-zinc-50 rounded-xl text-xs font-bold min-h-[80px]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newFilter.channel}
                    onChange={(e) => setNewFilter(prev => ({ ...prev, channel: e.target.value }))}
                    className="p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                  >
                    <option value="push">Push</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                  <select
                    value={newFilter.frequency}
                    onChange={(e) => setNewFilter(prev => ({ ...prev, frequency: e.target.value }))}
                    className="p-3 bg-zinc-50 rounded-xl text-xs font-bold"
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateFilter}
                  disabled={creatingFilter}
                  className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold disabled:opacity-60"
                >
                  {creatingFilter ? 'Creating...' : 'Create Filter'}
                </button>
              </div>
            </div>

            {filters.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-100 p-6 text-center text-[11px] font-bold text-zinc-500">
                No filters configured.
              </div>
            ) : (
              filters.map(filter => (
                <div key={filter.id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{filter.name || 'Filter'}</p>
                    <p className="text-[10px] text-zinc-500">{filter.channel || 'all'} • {filter.frequency || 'instant'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFilter(filter)}
                      className="p-1 rounded-full"
                    >
                      {filter.active ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(filter.id)}
                      className="text-[10px] font-bold text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
