import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import TechnicianDashboardView from './TechnicianDashboardView';
import TechnicianWorkView from '../technician/TechnicianWorkView';
import TechnicianCompletedView from '../technician/TechnicianCompletedView';
import NotificationsList from '../notifications/NotificationsList';
import NotificationDropdown from '../notifications/NotificationDropdown';
import SettingsView from '../common/SettingsView';
import MobileBottomNav from '../common/MobileBottomNav';
import {
  LayoutDashboard,
  CheckCircle,
  Bell,
  Settings,
  LogOut,
  Search,
} from 'lucide-react';

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Fetch Unread Count
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res.status === 'success' && res.data) {
        setUnreadNotifications(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading unread notification count:', err);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadNotifications },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabChange = (tabId) => {
    setSelectedComplaintId(null);
    setCurrentTab(tabId);
    setShowNotifDropdown(false);
  };

  const handleSelectComplaint = (id) => {
    setSelectedComplaintId(id);
    setShowNotifDropdown(false);
  };

  return (
    <div className="h-screen bg-surface-bg flex flex-col md:flex-row text-ink font-sans overflow-hidden">
      {/* SIDEBAR NAVIGATION (COLLAPSED ON MOBILE < 760px) */}
      <aside className="hidden md:flex w-64 bg-sidebar text-white p-5 flex-col justify-between flex-shrink-0 h-screen sticky top-0 border-r border-white/5 z-20">
        <div className="space-y-6">
          {/* Brand Mark */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-2.5 h-2.5 rounded bg-brand shadow-[0_0_0_4px_rgba(42,79,209,0.25)]" />
            <span className="font-display font-bold text-lg tracking-tight">ResolveDesk</span>
          </div>

          <div className="text-[10.5px] uppercase tracking-wider font-semibold text-[#5C6488] px-2">
            Technician Menu
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id && !selectedComplaintId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-sidebar-soft text-white font-semibold shadow-sm'
                      : 'text-sidebar-text hover:bg-sidebar-soft hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 opacity-85" />
                    <span>{item.label}</span>
                  </div>

                  {Boolean(item.badge) && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-danger text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="pt-4 mt-6 border-t border-white/10 space-y-3">
          <div
            onClick={() => handleTabChange('settings')}
            className="flex items-center gap-3 px-2 py-1 cursor-pointer rounded-xl hover:bg-sidebar-soft transition group"
          >
            <div className="w-8 h-8 rounded-full bg-purple text-white flex items-center justify-center font-display font-bold text-xs flex-shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate group-hover:text-brand-soft">
                {user?.name || 'Technician'}
              </p>
              <p className="text-[11px] text-sidebar-text truncate">Technician Account</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-text hover:bg-sidebar-soft hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT SCROLLABLE CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-16 md:pb-0">
        {/* Sticky Topbar */}
        <header className="h-16 bg-white border-b border-surface-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 flex-shrink-0 shadow-subtle">
          <div className="flex items-center gap-3 bg-surface-bg border border-surface-border rounded-xl px-3 py-1.5 w-48 sm:w-72 text-ink-muted">
            <Search className="w-4 h-4 opacity-50 flex-shrink-0" />
            <input
              placeholder="Search assigned work, IDs..."
              className="bg-transparent border-none text-xs w-full focus:outline-none text-ink placeholder:text-ink-muted"
            />
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Topbar Bell Icon Button with Unread Badge */}
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className={`relative p-2.5 rounded-xl border transition text-ink-muted hover:text-ink cursor-pointer ${
                showNotifDropdown
                  ? 'border-brand bg-brand-soft text-brand shadow-sm'
                  : 'border-surface-border hover:bg-surface-bg'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-status-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popup */}
            {showNotifDropdown && (
              <NotificationDropdown
                onClose={() => setShowNotifDropdown(false)}
                onSelectComplaint={(id) => handleSelectComplaint(id)}
                onViewAll={() => handleTabChange('notifications')}
                onNotificationsUpdated={(count) => setUnreadNotifications(count)}
              />
            )}

            <div
              onClick={() => handleTabChange('settings')}
              className="w-8 h-8 rounded-full bg-purple text-white flex items-center justify-center font-display font-bold text-xs cursor-pointer hover:opacity-90 transition"
              title="Settings"
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TC'}
            </div>
          </div>
        </header>

        {/* Main Body View */}
        <main className="p-4 md:p-8 flex-1">
          {selectedComplaintId ? (
            <TechnicianWorkView
              complaintId={selectedComplaintId}
              onBack={() => setSelectedComplaintId(null)}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <TechnicianDashboardView
                  onOpenComplaint={(id) => handleSelectComplaint(id)}
                  onOpenWorkView={(id) => handleSelectComplaint(id)}
                />
              )}

              {currentTab === 'completed' && (
                <TechnicianCompletedView
                  onOpenWorkView={(id) => handleSelectComplaint(id)}
                />
              )}

              {currentTab === 'notifications' && (
                <NotificationsList
                  onSelectComplaint={(id) => handleSelectComplaint(id)}
                  onNotificationsUpdated={(count) => setUnreadNotifications(count)}
                />
              )}

              {currentTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR (< 760px) */}
        <MobileBottomNav
          items={navItems}
          currentTab={currentTab}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
}
