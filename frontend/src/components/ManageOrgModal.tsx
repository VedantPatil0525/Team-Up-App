import React, { useState } from 'react';
import { Team, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Building2, UserPlus, UserCheck, ShieldCheck } from 'lucide-react';

interface ManageOrgModalProps {
  teams: Team[];
  onClose: () => void;
  onRefresh: () => void;
}

export const ManageOrgModal: React.FC<ManageOrgModalProps> = ({
  teams,
  onClose,
  onRefresh,
}) => {
  const { availablePersonas, refreshPersonas } = useAuth();
  const [activeTab, setActiveTab] = useState<'NEW_TEAM' | 'NEW_USER' | 'ASSIGN_ROLE'>('NEW_TEAM');

  // New Team Form
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  // New User Form
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('MEMBER');

  // Assign Role Form
  const [selectedUserId, setSelectedUserId] = useState(availablePersonas[0]?.id || '');
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [selectedRole, setSelectedRole] = useState('MEMBER');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.createTeam({
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });
      setFeedback({ type: 'success', message: `Team '${teamName}' created successfully!` });
      setTeamName('');
      setTeamDescription('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create team.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.createUser({
        name: userName.trim(),
        email: userEmail.trim(),
        system_role: userRole,
      });
      setFeedback({ type: 'success', message: `Employee '${userName}' registered successfully!` });
      setUserName('');
      setUserEmail('');
      await refreshPersonas();
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to register employee.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedTeamId) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.addTeamMember(selectedTeamId, {
        user_id: selectedUserId,
        team_role: selectedRole,
      });
      setFeedback({ type: 'success', message: 'Team membership and role updated!' });
      await refreshPersonas();
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update membership.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '600px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Manage Teams & Employees
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)',
          padding: '0 16px'
        }}>
          <button
            onClick={() => { setActiveTab('NEW_TEAM'); setFeedback(null); }}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'NEW_TEAM' ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === 'NEW_TEAM' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + New Team
          </button>
          <button
            onClick={() => { setActiveTab('NEW_USER'); setFeedback(null); }}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'NEW_USER' ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === 'NEW_USER' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Register Employee
          </button>
          <button
            onClick={() => { setActiveTab('ASSIGN_ROLE'); setFeedback(null); }}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'ASSIGN_ROLE' ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === 'ASSIGN_ROLE' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Assign Team Roles
          </button>
        </div>

        <div className="modal-body">
          {feedback && (
            <div style={{
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              borderLeft: `4px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
              padding: '10px 14px',
              color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
              fontSize: '13px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px'
            }}>
              {feedback.message}
            </div>
          )}

          {/* Tab 1: Create Custom Team */}
          {activeTab === 'NEW_TEAM' && (
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Team Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Platform & Analytics"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Team Purpose / Operational Scope:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Manages data ingestion pipelines and telemetry dashboards..."
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  className="textarea"
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          )}

          {/* Tab 2: Register New Employee */}
          {activeTab === 'NEW_USER' && (
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Employee Full Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Sharma"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Corporate Email:
                </label>
                <input
                  type="email"
                  placeholder="e.g. rohan.sharma@teamup.internal"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  System Role:
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="select"
                >
                  <option value="MEMBER">Standard Employee (Member)</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {isSubmitting ? 'Registering...' : 'Register Employee'}
              </button>
            </form>
          )}

          {/* Tab 3: Assign Member to Team with Scoped Role */}
          {activeTab === 'ASSIGN_ROLE' && (
            <form onSubmit={handleAssignRole} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Select Employee:
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="select"
                  required
                >
                  {availablePersonas.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Select Team:
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="select"
                  required
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Scoped Team Responsibility:
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="select"
                >
                  <option value="LEAD">TEAM LEAD (Can approve gated requests, reassign items)</option>
                  <option value="MEMBER">TEAM MEMBER (Can claim, investigate, and progress tickets)</option>
                  <option value="OBSERVER">OBSERVER (Read-only visibility for compliance/auditors)</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {isSubmitting ? 'Updating...' : 'Assign Role'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
