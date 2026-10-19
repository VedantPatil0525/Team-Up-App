import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Team, WorkItemListItem, ConflictDetail } from './types';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { TriageDashboard, TriageQueue } from './components/TriageDashboard';
import { WorkItemFilterBar } from './components/WorkItemFilterBar';
import { WorkItemTable } from './components/WorkItemTable';
import { WorkItemDetailModal } from './components/WorkItemDetailModal';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { CreateTicketModal } from './components/CreateTicketModal';
import { ManageOrgModal } from './components/ManageOrgModal';
import { Users, ShieldCheck, Home, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export const App: React.FC = () => {
  const { currentUser, availablePersonas, switchPersona, logout, isLoading } = useAuth();

  // Navigation View: 'LANDING' or 'APP'
  const [currentView, setCurrentView] = useState<'LANDING' | 'APP'>(() => {
    return (localStorage.getItem('team_up_view') as 'LANDING' | 'APP') || 'LANDING';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sidebar Collapsed state (persisted across sessions)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('team_up_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('team_up_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Theme: 'dark' or 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('team_up_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('team_up_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Organization data
  const [teams, setTeams] = useState<Team[]>([]);

  // Triage state
  const [activeQueue, setActiveQueue] = useState<TriageQueue>('ALL');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Table pagination & items
  const [items, setItems] = useState<WorkItemListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Triage metric counters
  const [queueCounts, setQueueCounts] = useState({
    all: 0,
    assignedToMe: 0,
    pendingApproval: 0,
    p0: 0,
    unassigned: 0,
  });

  // Modals state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeConflict, setActiveConflict] = useState<ConflictDetail | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  // Fetch Teams
  const loadTeams = async () => {
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Fetch Items according to filters and queue lenses
  const fetchWorkItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      let assigneeId: string | undefined = undefined;
      let unassignedOnly = false;
      let pendingApprovalOnly = false;
      let priorityFilter: string | undefined = selectedPriority || undefined;

      if (activeQueue === 'ASSIGNED_TO_ME' && currentUser) {
        assigneeId = currentUser.id;
      } else if (activeQueue === 'UNASSIGNED') {
        unassignedOnly = true;
      } else if (activeQueue === 'PENDING_APPROVAL') {
        pendingApprovalOnly = true;
      } else if (activeQueue === 'P0_CRITICAL') {
        priorityFilter = 'P0_CRITICAL';
      }

      const res = await api.getWorkItems({
        page,
        page_size: 25,
        team_id: selectedTeam || undefined,
        status: selectedStatus || undefined,
        priority: priorityFilter,
        category: selectedCategory || undefined,
        assignee_id: assigneeId,
        unassigned_only: unassignedOnly,
        pending_approval_only: pendingApprovalOnly,
        search: search || undefined,
      });

      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load work items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  }, [page, activeQueue, currentUser, selectedTeam, selectedStatus, selectedPriority, selectedCategory, search]);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

  // Fetch Metric Counters for Sidebar and Triage Cards
  const fetchMetricCounts = useCallback(async () => {
    try {
      const [allRes, p0Res, unassignedRes, pendingRes, assignedRes] = await Promise.all([
        api.getWorkItems({ page: 1, page_size: 1 }),
        api.getWorkItems({ page: 1, page_size: 1, priority: 'P0_CRITICAL' }),
        api.getWorkItems({ page: 1, page_size: 1, unassigned_only: true }),
        api.getWorkItems({ page: 1, page_size: 1, pending_approval_only: true }),
        currentUser ? api.getWorkItems({ page: 1, page_size: 1, assignee_id: currentUser.id }) : Promise.resolve({ total: 0 }),
      ]);

      setQueueCounts({
        all: allRes.total,
        p0: p0Res.total,
        unassigned: unassignedRes.total,
        pendingApproval: pendingRes.total,
        assignedToMe: assignedRes.total,
      });
    } catch (err) {
      console.error('Failed to fetch metric counters:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMetricCounts();
  }, [fetchMetricCounts, items]);

  const handleQueueChange = (queue: TriageQueue) => {
    setActiveQueue(queue);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedTeam('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedCategory('');
    setActiveQueue('ALL');
    setPage(1);
  };

  // If user is viewing the Public Landing Page
  if (currentView === 'LANDING') {
    return (
      <>
        <LandingPage
          onEnterApp={() => setIsAuthModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        {isAuthModalOpen && (
          <AuthModal
            teams={teams}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => {
              setIsAuthModalOpen(false);
              localStorage.setItem('team_up_view', 'APP');
              setCurrentView('APP');
              fetchWorkItems();
            }}
          />
        )}
      </>
    );
  }

  // Strict Security Route Guard: If in App view without an authenticated session, redirect to Landing & open Auth Modal
  if (currentView === 'APP' && !currentUser && !isLoading) {
    return (
      <>
        <LandingPage
          onEnterApp={() => setIsAuthModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <AuthModal
          teams={teams}
          onClose={() => {
            localStorage.setItem('team_up_view', 'LANDING');
            setCurrentView('LANDING');
            setIsAuthModalOpen(false);
          }}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            localStorage.setItem('team_up_view', 'APP');
            setCurrentView('APP');
            fetchWorkItems();
          }}
        />
      </>
    );
  }

  // Inside the Operational Command Center (App Shell)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeQueue={activeQueue}
        onSelectQueue={handleQueueChange}
        queueCounts={queueCounts}
        onOpenCreate={() => setIsCreateModalOpen(true)}
        onOpenOrg={() => setIsOrgModalOpen(true)}
        onSignOut={() => {
          logout();
          localStorage.setItem('team_up_view', 'LANDING');
          setCurrentView('LANDING');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Operational Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
        {/* Sub-Header Bar */}
        <header style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleSidebar}
              className="btn btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title={isSidebarCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              <span>{isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse'}</span>
            </button>
            <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }}></div>
            <button
              onClick={() => {
                localStorage.setItem('team_up_view', 'LANDING');
                setCurrentView('LANDING');
              }}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title="Return to Product Landing Page"
            >
              <Home size={14} />
              Home
            </button>
            <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }}></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Queue: <strong style={{ color: 'var(--text-primary)' }}>{activeQueue.replace('_', ' ')}</strong>
            </div>
          </div>

          {/* Quick Persona Selector Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-primary)',
            padding: '5px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-default)'
          }}>
            <Users size={15} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Persona
              </div>
              <select
                value={currentUser?.id || ''}
                onChange={(e) => switchPersona(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {availablePersonas.map((p) => {
                  const leadTeam = p.teams.find((t) => t.team_role === 'LEAD');
                  const roleBadge = leadTeam ? `(Lead: ${leadTeam.team_name})` : `(${p.teams[0]?.team_role || 'Member'})`;
                  return (
                    <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>
                      {p.name} {roleBadge}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="main-content" style={{ padding: '24px 32px' }}>
          {/* Triage Overview Cards */}
          <TriageDashboard
            activeQueue={activeQueue}
            onSelectQueue={handleQueueChange}
            counts={queueCounts}
          />

          {/* Multi-Faceted Filters */}
          <WorkItemFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            selectedTeam={selectedTeam}
            onTeamChange={(v) => { setSelectedTeam(v); setPage(1); }}
            selectedStatus={selectedStatus}
            onStatusChange={(v) => { setSelectedStatus(v); setPage(1); }}
            selectedPriority={selectedPriority}
            onPriorityChange={(v) => { setSelectedPriority(v); setPage(1); }}
            selectedCategory={selectedCategory}
            onCategoryChange={(v) => { setSelectedCategory(v); setPage(1); }}
            teams={teams}
            onReset={handleResetFilters}
          />

          {/* High-Performance Paginated Table */}
          <WorkItemTable
            items={items}
            isLoading={isLoadingItems}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(newPage) => setPage(newPage)}
            onSelectItem={(item) => setSelectedItemId(item.id)}
          />
        </main>
      </div>

      {/* Ticket Detail Drawer Modal */}
      {selectedItemId && (
        <WorkItemDetailModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onUpdated={() => {
            fetchWorkItems();
            fetchMetricCounts();
          }}
          onConflict={(conflict) => setActiveConflict(conflict)}
        />
      )}

      {/* OCC Conflict Resolution Modal */}
      {activeConflict && (
        <ConflictResolutionModal
          conflict={activeConflict}
          onClose={() => setActiveConflict(null)}
          onReload={() => {
            setActiveConflict(null);
            fetchWorkItems();
            if (selectedItemId) {
              const id = selectedItemId;
              setSelectedItemId(null);
              setTimeout(() => setSelectedItemId(id), 50);
            }
          }}
        />
      )}

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <CreateTicketModal
          teams={teams}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            fetchWorkItems();
            fetchMetricCounts();
          }}
        />
      )}

      {/* Dynamic Org & Member Management Modal */}
      {isOrgModalOpen && (
        <ManageOrgModal
          teams={teams}
          onClose={() => setIsOrgModalOpen(false)}
          onRefresh={() => {
            loadTeams();
            fetchWorkItems();
          }}
        />
      )}


    </div>
  );
};
