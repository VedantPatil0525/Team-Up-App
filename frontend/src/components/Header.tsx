import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, ShieldCheck, Activity, Building2 } from 'lucide-react';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenOrgModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateModal, onOpenOrgModal }) => {
  const { currentUser, availablePersonas, switchPersona } = useAuth();

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 32px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand & Live Connection Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
              <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Team-Up
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--primary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  OPS CORE
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'var(--bg-primary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            Supabase PostgreSQL Active
          </div>
        </div>

        {/* Action Controls & Persona Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onOpenOrgModal}
            className="btn btn-secondary"
            title="Dynamically create teams or add employees"
          >
            <Building2 size={15} />
            Manage Org
          </button>

          <button
            onClick={onOpenCreateModal}
            className="btn btn-primary"
          >
            <Plus size={16} />
            New Request
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }}></div>

          {/* Quick Persona Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-primary)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)'
          }}>
            <Users size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Acting Persona
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
                  outline: 'none',
                  paddingRight: '6px'
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
        </div>
      </div>
    </header>
  );
};
