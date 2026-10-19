import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TriageQueue } from './TriageDashboard';
import {
  Layers, UserCheck, Clock, AlertCircle, Inbox, Plus,
  Building2, LogOut, Sun, Moon, ShieldCheck, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  activeQueue: TriageQueue;
  onSelectQueue: (queue: TriageQueue) => void;
  queueCounts: {
    all: number;
    assignedToMe: number;
    pendingApproval: number;
    p0: number;
    unassigned: number;
  };
  onOpenCreate: () => void;
  onOpenOrg: () => void;
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeQueue,
  onSelectQueue,
  queueCounts,
  onOpenCreate,
  onOpenOrg,
  onSignOut,
  theme,
  onToggleTheme,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { currentUser } = useAuth();

  const navItems = [
    { id: 'ALL' as TriageQueue, label: 'All Active Work', icon: Layers, count: queueCounts.all },
    { id: 'ASSIGNED_TO_ME' as TriageQueue, label: 'Assigned to Me', icon: UserCheck, count: queueCounts.assignedToMe },
    { id: 'PENDING_APPROVAL' as TriageQueue, label: 'Awaiting Approval', icon: Clock, count: queueCounts.pendingApproval, highlight: true },
    { id: 'P0_CRITICAL' as TriageQueue, label: 'P0 Incidents', icon: AlertCircle, count: queueCounts.p0, alert: true },
    { id: 'UNASSIGNED' as TriageQueue, label: 'Unassigned Queue', icon: Inbox, count: queueCounts.unassigned },
  ];

  return (
    <aside style={{
      width: isCollapsed ? '72px' : '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100vh',
      position: 'sticky',
      top: 0,
      padding: isCollapsed ? '20px 10px' : '20px 16px',
      transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), padding 0.2s ease',
      flexShrink: 0,
      zIndex: 40
    }}>
      {/* Brand & Action Buttons */}
      <div>
        {isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <img
              src="/logo.png"
              alt="Team-Up"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="btn btn-secondary"
                style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/logo.png"
                alt="Team-Up"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Team-Up
                </div>
              </div>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="btn btn-secondary"
                style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
          </div>
        )}

        {/* Quick New Request Button */}
        {isCollapsed ? (
          <button
            onClick={onOpenCreate}
            className="btn btn-primary"
            title="New Request"
            style={{ width: '44px', height: '40px', padding: 0, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
          >
            <Plus size={18} />
          </button>
        ) : (
          <button
            onClick={onOpenCreate}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '16px', padding: '10px', borderRadius: '8px' }}
          >
            <Plus size={16} />
            New Request
          </button>
        )}

        {/* Navigation Section */}
        {!isCollapsed && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 8px' }}>
            Triage Queues
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeQueue === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectQueue(item.id)}
                title={isCollapsed ? `${item.label} (${item.count})` : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  padding: isCollapsed ? '10px 0' : '9px 12px',
                  width: isCollapsed ? '44px' : '100%',
                  margin: isCollapsed ? '0 auto' : '0',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {item.count > 0 && (
                  isCollapsed ? (
                    <span style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: item.alert ? '#ef4444' : (item.highlight ? '#c084fc' : 'var(--primary)')
                    }} />
                  ) : (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: item.alert ? 'rgba(239, 68, 68, 0.2)' : (item.highlight ? 'rgba(192, 132, 252, 0.2)' : 'var(--bg-tertiary)'),
                      color: item.alert ? '#ef4444' : (item.highlight ? '#c084fc' : 'var(--text-muted)')
                    }}>
                      {item.count}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </nav>

        {/* Organization Management */}
        <div style={{ marginTop: '20px' }}>
          {isCollapsed ? (
            <button
              onClick={onOpenOrg}
              title="Manage Teams & Users"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '40px',
                margin: '0 auto',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <Building2 size={16} />
            </button>
          ) : (
            <button
              onClick={onOpenOrg}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Building2 size={16} />
              Manage Teams & Users
            </button>
          )}
        </div>
      </div>

      {/* User Footer & Theme Switcher */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
        {/* Theme Toggle Button */}
        {isCollapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary"
              style={{ padding: '6px', borderRadius: '50%' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={14} style={{ color: '#f59e0b' }} /> : <Moon size={14} style={{ color: '#6366f1' }} />}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Theme:</span>
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '16px' }}
            >
              {theme === 'dark' ? <Sun size={13} style={{ color: '#f59e0b' }} /> : <Moon size={13} style={{ color: '#6366f1' }} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        )}

        {/* User Card */}
        {isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              title={`${currentUser?.name || 'Employee'} (${currentUser?.email || ''})`}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'default'
              }}
            >
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <button
              onClick={onSignOut}
              title="Sign out to landing page"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-primary)',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px'
              }}>
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser?.name || 'Employee'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser?.email}
                </div>
              </div>
            </div>

            <button
              onClick={onSignOut}
              title="Sign out to landing page"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
