import React, { useState } from 'react';
import { Menu, Shield, Bell, Activity, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DomainProvider, useDomains } from './context/DomainContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { LeftSidebar, NavItem } from './components/dashboard/LeftSidebar';
import { CenterContent } from './components/dashboard/CenterContent';
import { RightSidebar } from './components/dashboard/RightSidebar';
import { AddDomainModal } from './components/AddDomainModal';
import { EditDomainModal } from './components/EditDomainModal';
import { DomainDetailsModal } from './components/dashboard/DomainDetailsModal';
import { TeamMembersModal } from './components/dashboard/TeamMembersModal';
import { SettingsModal } from './components/dashboard/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { DNSInspectorDrawer } from './components/dashboard/DNSInspectorDrawer';
import { DomainRecord } from './types/domain';

const DashboardLayout: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavItem>('all-domains');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string | null>(null);
  const { unreadCount } = useDomains();
  const { logout } = useAuth();

  // Mobile drawers state (< xl)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [selectedDomainDetails, setSelectedDomainDetails] = useState<DomainRecord | null>(null);
  const [dnsInspectorDomain, setDnsInspectorDomain] = useState<string | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'alert' | 'email' | 'team' | 'database'>('alert');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col xl:flex-row overflow-x-hidden font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* MOBILE / TABLET TOP HEADER (< xl) */}
      <header className="xl:hidden w-full bg-white border-b border-slate-200/90 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="p-1.5 -ml-1 text-slate-700 hover:text-zinc-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 fill-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900">
              DomainPulse
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Live monitoring online"></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Quick Bell */}
          <button
            type="button"
            onClick={() => setActiveNav('inbox')}
            className="relative p-2 text-slate-600 hover:text-zinc-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Alert notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* Telemetry & Metrics Quick Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileProfileOpen(true)}
            className="relative p-2 text-slate-600 hover:text-zinc-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="System Health & Metrics"
          >
            <Activity className="w-4 h-4 text-zinc-700" />
            <span className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white"></span>
          </button>
        </div>
      </header>

      {/* MOBILE LEFT NAVIGATION DRAWER (< xl) */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-250">
            <LeftSidebar
              activeNav={activeNav}
              setActiveNav={setActiveNav}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onCloseDrawer={() => setIsMobileNavOpen(false)}
              className="w-full h-full border-r-0 shadow-none"
            />
          </div>
        </div>
      )}

      {/* MOBILE RIGHT TELEMETRY & HEALTH DRAWER (< xl) */}
      {isMobileProfileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileProfileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-250">
            <RightSidebar
              onOpenExpiryTimeline={() => {
                setActiveNav('calendar');
                setIsMobileProfileOpen(false);
              }}
              onCloseDrawer={() => setIsMobileProfileOpen(false)}
              className="w-full h-full border-l-0 shadow-none"
            />
          </div>
        </div>
      )}

      {/* COLUMN 1: Left Navigation Sidebar (Desktop xl:+) */}
      <div className="hidden xl:flex shrink-0">
        <LeftSidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
      </div>

      {/* COLUMN 2: Center Main Content Area */}
      <CenterContent
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenEditDomain={(domain) => setEditingDomain(domain)}
        onOpenDomainDetails={(domain) => setSelectedDomainDetails(domain)}
        onOpenDNSInspector={(domainName) => setDnsInspectorDomain(domainName)}
        selectedOwnerFilter={selectedOwnerFilter}
        onClearOwnerFilter={() => setSelectedOwnerFilter(null)}
      />

      {/* COLUMN 3: Right Telemetry & Health Sidebar (Desktop xl:+) */}
      <div className="hidden xl:flex shrink-0">
        <RightSidebar
          onOpenExpiryTimeline={() => setActiveNav('calendar')}
        />
      </div>

      {/* Modal Dialogs */}
      <AddDomainModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditDomainModal
        isOpen={!!editingDomain}
        domain={editingDomain}
        onClose={() => setEditingDomain(null)}
      />

      <DomainDetailsModal
        domain={selectedDomainDetails}
        isOpen={!!selectedDomainDetails}
        onClose={() => setSelectedDomainDetails(null)}
        onOpenEdit={(domain) => setEditingDomain(domain)}
        onOpenDNSInspector={(domainName) => setDnsInspectorDomain(domainName)}
      />

      <DNSInspectorDrawer
        isOpen={!!dnsInspectorDomain}
        domainName={dnsInspectorDomain || ''}
        onClose={() => setDnsInspectorDomain(null)}
      />

      <TeamMembersModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSelectDepartment={(dept) => {
          setSelectedOwnerFilter(dept);
          setActiveNav('all-domains');
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        defaultTab={settingsDefaultTab}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

const RootAppGate: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-md animate-pulse">
            <Shield className="w-5 h-5 fill-white" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-900" />
            <span>Checking Supabase active session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <DomainProvider>
      <DashboardLayout />
    </DomainProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootAppGate />
    </AuthProvider>
  );
}
