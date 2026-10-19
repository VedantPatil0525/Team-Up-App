import React, { useState, useEffect } from 'react';
import { WorkItem, ConflictDetail } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X, UserCheck, ShieldCheck, ShieldAlert, History, MessageSquare,
  Edit3, ArrowRight, Eye, RefreshCw, AlertTriangle
} from 'lucide-react';

interface WorkItemDetailModalProps {
  itemId: string;
  onClose: () => void;
  onUpdated: () => void;
  onConflict: (conflict: ConflictDetail) => void;
}

export const WorkItemDetailModal: React.FC<WorkItemDetailModalProps> = ({
  itemId,
  onClose,
  onUpdated,
  onConflict,
}) => {
  const { currentUser } = useAuth();
  const [item, setItem] = useState<WorkItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'AUDIT' | 'COMMENTS'>('DETAILS');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editReason, setEditReason] = useState('');

  // Comment State
  const [newComment, setNewComment] = useState('');

  // Status transition state
  const [transitionStatus, setTransitionStatus] = useState('');
  const [transitionReason, setTransitionReason] = useState('');

  // Action feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchItem = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await api.getWorkItem(itemId);
      setItem(data);
      setEditTitle(data.title);
      setEditDescription(data.description);
      setEditPriority(data.priority);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load ticket details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  // Authorization check helper
  const isTeamLead = () => {
    if (!currentUser || !item) return false;
    if (currentUser.system_role === 'ADMIN') return true;
    const membership = currentUser.teams.find((t) => t.team_id === item.team_id);
    return membership?.team_role === 'LEAD';
  };

  const isObserver = () => {
    if (!currentUser || !item) return false;
    if (currentUser.system_role === 'ADMIN') return false;
    const membership = currentUser.teams.find((t) => t.team_id === item.team_id);
    return membership?.team_role === 'OBSERVER';
  };

  // Handle Atomic Claim
  const handleClaim = async () => {
    if (!item) return;
    setActionError(null);
    try {
      await api.claimWorkItem(item.id, 'Claimed via quick action in detail drawer.');
      setActionSuccess('Successfully claimed ownership!');
      await fetchItem();
      onUpdated();
    } catch (err: any) {
      if (err.status === 409) {
        setActionError(`Claim Collision: ${err.message}`);
      } else {
        setActionError(err.message || 'Failed to claim item.');
      }
    }
  };

  // Handle OCC Edit
  const handleSaveEdit = async () => {
    if (!item) return;
    setActionError(null);
    try {
      await api.updateWorkItem(item.id, {
        version: item.version, // OCC expected version
        title: editTitle,
        description: editDescription,
        priority: editPriority as any,
        edit_reason: editReason || 'Updated item details via modal.',
      });
      setIsEditing(false);
      setEditReason('');
      setActionSuccess('Work item updated successfully!');
      await fetchItem();
      onUpdated();
    } catch (err: any) {
      if (err.status === 409 && err.conflictData) {
        onConflict(err.conflictData);
        onClose();
      } else {
        setActionError(err.message || 'Update failed.');
      }
    }
  };

  // Handle State Machine Transition
  const handleTransition = async () => {
    if (!item || !transitionStatus) return;
    setActionError(null);
    try {
      await api.transitionWorkItem(item.id, {
        version: item.version,
        target_status: transitionStatus,
        reason: transitionReason || `Transitioned to ${transitionStatus}`,
      });
      setTransitionStatus('');
      setTransitionReason('');
      setActionSuccess('Status updated successfully!');
      await fetchItem();
      onUpdated();
    } catch (err: any) {
      if (err.status === 409) {
        setActionError('Collision: The item was modified while you were viewing it. Please refresh.');
      } else {
        setActionError(err.message || 'Transition rejected by workflow state machine.');
      }
    }
  };

  // Handle Gated Approval
  const handleApprovalDecision = async (approved: boolean) => {
    if (!item) return;
    setActionError(null);
    try {
      await api.approveWorkItem(item.id, {
        version: item.version,
        approved,
        reason: approved ? 'Approved by Team Lead after review.' : 'Rejected by Team Lead.',
      });
      setActionSuccess(approved ? 'Approval granted!' : 'Approval rejected.');
      await fetchItem();
      onUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Approval decision rejected.');
    }
  };

  // Handle Comment Submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !newComment.trim()) return;
    try {
      await api.addComment(item.id, newComment.trim());
      setNewComment('');
      await fetchItem();
      onUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to post comment.');
    }
  };

  if (isLoading && !item) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: '40px', textAlign: 'center' }}>
          Loading work item details...
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '850px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              background: 'var(--bg-primary)',
              padding: '3px 8px',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)'
            }}>
              v{item.version} (OCC)
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {item.category.replace('_', ' ')}
            </span>
            {item.approval_required && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(192, 132, 252, 0.15)',
                color: '#c084fc',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                <ShieldAlert size={12} />
                Approval Gated
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Live Presence Simulation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}>
              <Eye size={12} />
              Active Viewer: {currentUser?.name || 'You'}
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Feedback Alerts */}
        {actionError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderLeft: '4px solid #ef4444',
            padding: '10px 16px',
            color: '#fca5a5',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            borderLeft: '4px solid #10b981',
            padding: '10px 16px',
            color: '#6ee7b7',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={16} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setActiveTab('DETAILS')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'DETAILS' ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === 'DETAILS' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Overview & Actions
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'AUDIT' ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === 'AUDIT' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <History size={14} />
            Audit History ({item.audit_events.length})
          </button>
          <button
            onClick={() => setActiveTab('COMMENTS')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'COMMENTS' ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === 'COMMENTS' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MessageSquare size={14} />
            Collaboration ({item.comments.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {activeTab === 'DETAILS' && (
            <div>
              {/* Approval Gating Banner */}
              {item.status === 'PENDING_APPROVAL' && (
                <div style={{
                  background: 'rgba(192, 132, 252, 0.1)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={16} />
                      Action Required: Awaiting Team Lead Approval
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      This request requires sign-off from a <strong>{item.team?.name} Lead</strong> before work can proceed.
                    </div>
                  </div>

                  {isTeamLead() ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApprovalDecision(true)} className="btn btn-success" style={{ padding: '6px 12px' }}>
                        Authorize / Approve
                      </button>
                      <button onClick={() => handleApprovalDecision(false)} className="btn btn-danger" style={{ padding: '6px 12px' }}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      You are viewing as {currentUser?.name}. Only Leads can sign off.
                    </div>
                  )}
                </div>
              )}

              {/* Title & Metadata */}
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Title:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input"
                  />

                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Description:</label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="textarea"
                  />

                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Priority:</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="select"
                  >
                    <option value="P0_CRITICAL">P0 - Critical</option>
                    <option value="P1_HIGH">P1 - High</option>
                    <option value="P2_MEDIUM">P2 - Medium</option>
                    <option value="P3_LOW">P3 - Low</option>
                  </select>

                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reason for edit (logged in audit trail):</label>
                  <input
                    type="text"
                    placeholder="e.g. Updating repro steps..."
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="input"
                  />

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button onClick={handleSaveEdit} className="btn btn-primary">
                      Save Changes (v{item.version})
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h2>
                    {!isObserver() && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <Edit3 size={13} />
                        Edit (OCC)
                      </button>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '10px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {item.description}
                  </p>
                </div>
              )}

              {/* Status & Ownership Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                background: 'var(--bg-primary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {item.status.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assignee</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {item.assignee ? item.assignee.name : (
                      <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Team</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {item.team?.name || 'Operations'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reporter</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {item.reporter?.name}
                  </div>
                </div>
              </div>

              {/* Lifecycle Actions */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {/* Claim Responsibility Button */}
                {!item.assignee && !isObserver() ? (
                  <button onClick={handleClaim} className="btn btn-primary">
                    <UserCheck size={15} />
                    Claim Responsibility (Atomic Race Test)
                  </button>
                ) : (
                  item.assignee && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Owned by <strong>{item.assignee.name}</strong>
                    </div>
                  )
                )}

                {/* State Machine Transition Controls */}
                {!isObserver() && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={transitionStatus}
                      onChange={(e) => setTransitionStatus(e.target.value)}
                      className="select"
                      style={{ width: 'auto', minWidth: '150px' }}
                    >
                      <option value="">Next Workflow Stage...</option>
                      <option value="TRIAGED">Triaged</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="PENDING_APPROVAL">Submit for Approval</option>
                      <option value="RESOLVED">Resolve Ticket</option>
                      <option value="CANCELLED">Cancel Ticket</option>
                    </select>

                    <button
                      onClick={handleTransition}
                      disabled={!transitionStatus}
                      className="btn btn-secondary"
                    >
                      Progress State
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          {activeTab === 'AUDIT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {item.audit_events.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {evt.actor?.name.charAt(0) || 'A'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                          {evt.actor?.name}
                        </strong>{' '}
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--primary)',
                          background: 'rgba(59, 130, 246, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontWeight: 600
                        }}>
                          {evt.action_type}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(evt.created_at).toLocaleString()}
                      </div>
                    </div>

                    {evt.context_note && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        "{evt.context_note}"
                      </div>
                    )}

                    {/* Diff Viewer */}
                    {(evt.old_values || evt.new_values) && (
                      <div style={{
                        marginTop: '8px',
                        background: 'var(--bg-secondary)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--text-muted)'
                      }}>
                        {evt.old_values && <div>- {JSON.stringify(evt.old_values)}</div>}
                        {evt.new_values && <div style={{ color: '#38bdf8' }}>+ {JSON.stringify(evt.new_values)}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collaboration Comments Tab */}
          {activeTab === 'COMMENTS' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {item.comments.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
                    No comments yet. Start the discussion below.
                  </div>
                ) : (
                  item.comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--bg-primary)',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          {c.author?.name}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(c.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {c.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Post Comment Form */}
              <form onSubmit={handleAddComment}>
                <textarea
                  rows={3}
                  placeholder="Add an internal note or investigation finding..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="textarea"
                  style={{ marginBottom: '8px' }}
                />
                <button type="submit" disabled={!newComment.trim()} className="btn btn-primary">
                  Post Comment
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
