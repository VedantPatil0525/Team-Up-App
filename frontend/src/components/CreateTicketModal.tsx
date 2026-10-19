import React, { useState } from 'react';
import { Team } from '../types';
import { api } from '../services/api';
import { X, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';

interface CreateTicketModalProps {
  teams: Team[];
  onClose: () => void;
  onCreated: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  teams,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [category, setCategory] = useState('OPERATIONAL_TASK');
  const [priority, setPriority] = useState('P2_MEDIUM');
  const [approvalRequired, setApprovalRequired] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiTriaging, setIsAiTriaging] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Call Gemini AI Auto-Triage
  const handleAiTriage = async () => {
    if (!title.trim() && !description.trim()) {
      setError('Please provide at least a title or description for AI triage.');
      return;
    }
    setError(null);
    setIsAiTriaging(true);
    try {
      const triage = await api.aiAutoTriage(title, description);
      setPriority(triage.suggested_priority);
      setCategory(triage.suggested_category);
      setAiRationale(`${triage.reasoning} (Identified risks: ${triage.risk_factors.join(', ')})`);
    } catch (err: any) {
      setError('AI Triage error: ' + (err.message || 'Service unavailable'));
    } finally {
      setIsAiTriaging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !teamId) {
      setError('Please fill in title, description, and assign a team.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await api.createWorkItem({
        title: title.trim(),
        description: description.trim(),
        team_id: teamId,
        category,
        priority,
        approval_required: approvalRequired,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit work item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Submit Operational Request
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderLeft: '4px solid #ef4444',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '13px',
                borderRadius: 'var(--radius-sm)'
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Title:
              </label>
              <input
                type="text"
                placeholder="e.g. Production Payment Webhook Latency Alert"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Operational Context & Details:
                </label>
                <button
                  type="button"
                  onClick={handleAiTriage}
                  disabled={isAiTriaging || (!title && !description)}
                  className="btn btn-secondary"
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    color: '#c084fc',
                    borderColor: 'rgba(192, 132, 252, 0.3)'
                  }}
                >
                  <Sparkles size={12} />
                  {isAiTriaging ? 'Analyzing...' : 'Smart Triage with Gemini'}
                </button>
              </div>
              <textarea
                rows={4}
                placeholder="Describe what occurred, impacted systems, customer ID, or financial amounts..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea"
                required
              />
            </div>

            {/* AI Recommendation Banner */}
            {aiRationale && (
              <div style={{
                background: 'rgba(192, 132, 252, 0.1)',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                color: '#e9d5ff'
              }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                  <Sparkles size={13} style={{ color: '#c084fc' }} />
                  Gemini Triage Recommendation Applied
                </div>
                <div>{aiRationale}</div>
              </div>
            )}

            {/* Team, Category, Priority Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Routing Team:
                </label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
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
                  Category:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select"
                >
                  <option value="INCIDENT">Incident</option>
                  <option value="PAYMENT_REVIEW">Payment Review</option>
                  <option value="COMPLIANCE">Compliance</option>
                  <option value="CUSTOMER_ISSUE">Customer Issue</option>
                  <option value="OPERATIONAL_TASK">Operational Task</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Urgency / Priority:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="select"
                >
                  <option value="P0_CRITICAL">P0 - Critical Outage</option>
                  <option value="P1_HIGH">P1 - High Urgency</option>
                  <option value="P2_MEDIUM">P2 - Normal Priority</option>
                  <option value="P3_LOW">P3 - Non-Urgent</option>
                </select>
              </div>

              <div style={{ marginTop: '18px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}>
                  <input
                    type="checkbox"
                    checked={approvalRequired}
                    onChange={(e) => setApprovalRequired(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={14} style={{ color: '#c084fc' }} />
                    Requires Team Lead Approval
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Submitting...' : 'Submit to Operations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
