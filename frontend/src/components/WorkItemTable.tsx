import React from 'react';
import { WorkItemListItem } from '../types';
import { ChevronLeft, ChevronRight, User, ShieldAlert, CheckCircle2, Inbox } from 'lucide-react';

interface WorkItemTableProps {
  items: WorkItemListItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onSelectItem: (item: WorkItemListItem) => void;
}

export const WorkItemTable: React.FC<WorkItemTableProps> = ({
  items,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
  onSelectItem,
}) => {
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'P0_CRITICAL': return 'badge-p0';
      case 'P1_HIGH': return 'badge-p1';
      case 'P2_MEDIUM': return 'badge-p2';
      default: return 'badge-p3';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW': return 'badge-status-new';
      case 'TRIAGED': return 'badge-status-triaged';
      case 'IN_PROGRESS': return 'badge-status-inprogress';
      case 'PENDING_APPROVAL': return 'badge-status-pending';
      case 'RESOLVED': return 'badge-status-resolved';
      default: return 'badge-status-cancelled';
    }
  };

  const formatPriority = (p: string) => p.replace('P0_', 'P0: ').replace('P1_', 'P1: ').replace('P2_', 'P2: ').replace('P3_', 'P3: ');
  const formatStatus = (s: string) => s.replace('_', ' ');

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{
              background: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '12px 16px' }}>Priority</th>
              <th style={{ padding: '12px 16px', minWidth: '320px' }}>Title & Scope</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Team</th>
              <th style={{ padding: '12px 16px' }}>Assignee</th>
              <th style={{ padding: '12px 16px' }}>Version</th>
              <th style={{ padding: '12px 16px' }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  Loading operational items...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)'
                    }}>
                      <Inbox size={22} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      No operational work items in this queue
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.5 }}>
                      Click <strong>"+ New Request"</strong> to create a work item with atomic claiming, optimistic concurrency control, and audit logs.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Priority Badge */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span className={`badge ${getPriorityBadgeClass(item.priority)}`}>
                      {formatPriority(item.priority)}
                    </span>
                  </td>

                  {/* Title & Gating Indicator */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.title}
                      </span>
                      {item.approval_required && (
                        <span
                          title="Requires Team Lead sign-off"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: 'rgba(192, 132, 252, 0.15)',
                            color: '#c084fc',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 600
                          }}
                        >
                          <ShieldAlert size={11} />
                          Gated
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {item.id.slice(0, 14)}... • {item.category.replace('_', ' ')}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {formatStatus(item.status)}
                    </span>
                  </td>

                  {/* Team */}
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {item.team_name || 'Unassigned Team'}
                  </td>

                  {/* Assignee */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {item.assignee_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#fff',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600
                        }}>
                          {item.assignee_name.charAt(0)}
                        </div>
                        <span style={{ color: 'var(--text-primary)' }}>{item.assignee_name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Version Counter (OCC) */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      background: 'var(--bg-primary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      v{item.version}
                    </span>
                  </td>

                  {/* Updated Timestamp */}
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-primary)',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <div>
          Showing {items.length > 0 ? (page - 1) * 25 + 1 : 0} to{' '}
          {Math.min(page * 25, total)} of {total} operational items
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="btn btn-secondary"
            style={{ padding: '4px 8px' }}
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', padding: '0 4px' }}>
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="btn btn-secondary"
            style={{ padding: '4px 8px' }}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
