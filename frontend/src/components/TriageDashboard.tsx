import React from 'react';
import { AlertCircle, Clock, Inbox, UserCheck, Layers } from 'lucide-react';

export type TriageQueue = 'ALL' | 'ASSIGNED_TO_ME' | 'PENDING_APPROVAL' | 'P0_CRITICAL' | 'UNASSIGNED';

interface TriageDashboardProps {
  activeQueue: TriageQueue;
  onSelectQueue: (queue: TriageQueue) => void;
  counts: {
    all: number;
    assignedToMe: number;
    pendingApproval: number;
    p0: number;
    unassigned: number;
  };
}

export const TriageDashboard: React.FC<TriageDashboardProps> = ({
  activeQueue,
  onSelectQueue,
  counts,
}) => {
  const cards = [
    {
      id: 'ALL' as TriageQueue,
      label: 'All Active Work',
      count: counts.all,
      icon: Layers,
      color: 'var(--primary)',
      desc: 'Complete operational volume',
    },
    {
      id: 'ASSIGNED_TO_ME' as TriageQueue,
      label: 'Assigned to Me',
      count: counts.assignedToMe,
      icon: UserCheck,
      color: '#38bdf8',
      desc: 'Work under your ownership',
    },
    {
      id: 'PENDING_APPROVAL' as TriageQueue,
      label: 'Awaiting Approval',
      count: counts.pendingApproval,
      icon: Clock,
      color: '#c084fc',
      desc: 'Gated requests needing sign-off',
    },
    {
      id: 'P0_CRITICAL' as TriageQueue,
      label: 'P0 Incidents',
      count: counts.p0,
      icon: AlertCircle,
      color: '#ef4444',
      desc: 'Immediate emergency actions',
    },
    {
      id: 'UNASSIGNED' as TriageQueue,
      label: 'Unassigned Triage',
      count: counts.unassigned,
      icon: Inbox,
      color: '#f59e0b',
      desc: 'Unclaimed incoming requests',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '14px',
      marginBottom: '24px'
    }}>
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeQueue === c.id;
        return (
          <div
            key={c.id}
            onClick={() => onSelectQueue(c.id)}
            style={{
              background: isActive ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
              border: `1px solid ${isActive ? c.color : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
              boxShadow: isActive ? `0 0 15px -3px ${c.color}25` : 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: isActive ? '#fff' : 'var(--text-secondary)' }}>
                {c.label}
              </span>
              <Icon size={16} style={{ color: c.color }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              {c.count}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {c.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
};
