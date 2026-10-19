import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Team } from '../types';
import { api } from '../services/api';
import { X, ArrowRight, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface AuthModalProps {
  teams: Team[];
  onClose: () => void;
  onSuccess: () => void;
}

// Google SVG Logo Component
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: 'popup' | 'redirect';
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: (notification?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({ teams, onClose, onSuccess }) => {
  const { availablePersonas, switchPersona, refreshPersonas, loginUser } = useAuth();
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [showSeedPersonas, setShowSeedPersonas] = useState(false);

  // Google OAuth 2.0 Client ID securely loaded from environment
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [selectedRole, setSelectedRole] = useState('MEMBER');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Process Real Google OAuth Credential (ID Token)
  const handleGoogleOAuthCallback = async (response: { credential: string }) => {
    if (!response.credential) {
      setError('Google authentication failed: no credential token received.');
      return;
    }
    setError(null);
    flushSync(() => {
      setIsSubmitting(true);
    });

    try {
      // Backend validates token cryptographically with Google tokeninfo API & provisions user in Supabase
      const user = await api.loginWithGoogle({
        id_token: response.credential,
        team_id: selectedTeamId || teams[0]?.id,
      });

      // Synchronously focus main window and update authentication state
      window.focus();
      loginUser(user);
      onClose();
      onSuccess();

      // Background refresh of organization rosters
      refreshPersonas();
    } catch (err: any) {
      setError(err.message || 'Google OAuth verification failed on server.');
      setIsSubmitting(false);
    }
  };

  // Mount Google Identity Services (GIS) Button
  useEffect(() => {
    let checkInterval: any = null;

    const initGis = () => {
      if (window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleOAuthCallback,
            auto_select: false,
            ux_mode: 'popup',
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: tab === 'LOGIN' ? 'signin_with' : 'signup_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 380,
            });
          }
        } catch (e: any) {
          console.warn('Google Identity Services init warning:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGis();
    } else {
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          initGis();
          clearInterval(checkInterval);
        } else if (attempts > 15) {
          clearInterval(checkInterval);
        }
      }, 250);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, tab, selectedTeamId]);

  // Demo Google Authentication (Fallback when no Client ID is configured)
  const handleDemoGoogleAuth = async () => {
    setError(null);
    flushSync(() => {
      setIsSubmitting(true);
    });
    try {
      const demoEmail = tab === 'LOGIN' ? 'demo.employee@google.internal' : `user.${Date.now().toString().slice(-4)}@google.com`;
      const demoName = tab === 'LOGIN' ? 'Google Workspace User' : 'New Google Employee';

      const user = await api.loginWithGoogle({
        email: demoEmail,
        name: demoName,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${demoName}`,
        team_id: selectedTeamId || teams[0]?.id,
      });

      flushSync(() => {
        loginUser(user);
        onClose();
        onSuccess();
      });
      refreshPersonas();
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed.');
      setIsSubmitting(false);
    }
  };

  // 1-Click Quick Persona Login
  const handleSelectPersona = async (userId: string) => {
    setError(null);
    try {
      await switchPersona(userId);
      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    }
  };

  // Email Sign In
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const found = availablePersonas.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (found) {
      await switchPersona(found.id);
      onClose();
      onSuccess();
    } else {
      setError(`No registered employee account found with email "${email}". Please register or use Google OAuth!`);
    }
  };

  // Sign Up New Account
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !signupEmail.trim() || !selectedTeamId) {
      setError('Please fill in all registration fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      // 1. Register User in PostgreSQL
      const newUser = await api.createUser({
        name: name.trim(),
        email: signupEmail.trim(),
        system_role: 'MEMBER',
      });

      // 2. Assign to selected team with chosen role
      await api.addTeamMember(selectedTeamId, {
        user_id: newUser.id,
        team_role: selectedRole,
      });

      // 3. Set user session and enter dashboard immediately
      loginUser(newUser);
      onClose();
      onSuccess();
      refreshPersonas();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '460px',
          width: '92%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)',
          flexShrink: 0
        }}>
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
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {tab === 'LOGIN' ? 'Sign in to Team-Up' : 'Create Employee Profile'}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                High-concurrency operational coordination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher - Fixed */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)',
          flexShrink: 0
        }}>
          <button
            onClick={() => { setTab('LOGIN'); setError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === 'LOGIN' ? 'var(--primary)' : 'transparent'}`,
              color: tab === 'LOGIN' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('SIGNUP'); setError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === 'SIGNUP' ? 'var(--primary)' : 'transparent'}`,
              color: tab === 'SIGNUP' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Register / Sign Up
          </button>
        </div>

        {/* Scrollable Body for both Sign In and Sign Up */}
        <div className="modal-scrollable" style={{ padding: '24px 24px 32px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              borderLeft: '4px solid #ef4444',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '12px',
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* GOOGLE SIGN-IN SECTION */}
          <div style={{ position: 'relative', minHeight: '44px', marginBottom: '20px' }}>
            {/* The Google button stays mounted without DOM distortion */}
            {googleClientId ? (
              <div
                ref={googleBtnRef}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  opacity: isSubmitting ? 0.4 : 1,
                  pointerEvents: isSubmitting ? 'none' : 'auto',
                  transition: 'opacity 0.2s ease'
                }}
              />
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDemoGoogleAuth}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px'
                }}
              >
                <GoogleLogo />
                <span>Continue with Google</span>
              </button>
            )}

            {/* Seamless Glassmorphic Loading Overlay */}
            {isSubmitting && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 600,
                zIndex: 10,
                boxShadow: '0 0 16px var(--primary-glow)'
              }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating with Google...</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              or continue with corporate email
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
          </div>

          {tab === 'LOGIN' ? (
            <div>
              {/* Email Form */}
              <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Corporate Email:
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. aarav.sharma@teamup.internal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Password:
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '4px', width: '100%', padding: '10px' }}>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              {/* Collapsible Seed Test Personas for Evaluators */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setShowSeedPersonas(!showSeedPersonas)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '4px'
                  }}
                >
                  <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                  <span>{showSeedPersonas ? 'Hide Evaluator Seed Personas' : 'Quick Demo: Pick a Seed Persona (Aarav, Samir, Rohan...)'}</span>
                  {showSeedPersonas ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {showSeedPersonas && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    marginTop: '10px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    padding: '2px'
                  }}>
                    {availablePersonas.map((p) => {
                      const leadTeam = p.teams.find((t) => t.team_role === 'LEAD');
                      const roleLabel = leadTeam ? `Lead: ${leadTeam.team_name}` : (p.teams[0]?.team_role || 'Member');
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPersona(p.id)}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                        >
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '10px',
                            flexShrink: 0
                          }}>
                            {p.name.charAt(0)}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {roleLabel}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Full Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Corporate Email:
                </label>
                <input
                  type="email"
                  placeholder="e.g. rohan.mehta@teamup.internal"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Department / Team:
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Team Responsibility / Role:
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="select"
                >
                  <option value="MEMBER">Standard Team Member (Can claim & investigate work)</option>
                  <option value="LEAD">Team Lead / Approver (Can authorize gated requests)</option>
                  <option value="OBSERVER">Observer (Read-only auditor)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{
                  marginTop: '16px',
                  marginBottom: '12px',
                  width: '100%',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {isSubmitting ? 'Registering...' : 'Create Account & Enter'}
                <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
