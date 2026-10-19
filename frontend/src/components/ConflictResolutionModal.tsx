import React from 'react';
import { ConflictDetail } from '../types';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ConflictResolutionModalProps {
  conflict: ConflictDetail;
  onClose: () => void;
  onReload: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onClose,
  onReload,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', width: '90%' }}>
        <div className="modal-header" style={{ background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
              Optimistic Concurrency Collision (HTTP 409)
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Another employee modified this work item while you had it open on your screen.
            To prevent silently overwriting their changes, the backend blocked your update.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* Client State */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '12px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Your Version (Obsolete)
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f87171' }}>
                Version {conflict.client_version}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Attempted edit based on outdated information.
              </div>
            </div>

            {/* Server State */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid #10b981',
              borderRadius: 'var(--radius-md)',
              padding: '12px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Current Server State (Latest)
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#34d399' }}>
                Version {conflict.server_version}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Title: <strong>{conflict.server_title || 'Modified on server'}</strong>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-primary)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <strong>Recommendation:</strong> Click below to reload the latest changes. You can then reapply your adjustments on top of the newest version.
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Dismiss
          </button>
          <button onClick={onReload} className="btn btn-primary">
            <RefreshCw size={14} />
            Reload Latest State & Reconcile
          </button>
        </div>
      </div>
    </div>
  );
};
