import React from 'react';
import {
  ShieldCheck, ArrowRight, Layers, Users, History,
  Lock, AlertTriangle, CheckCircle2, Sparkles, Building2, Sun, Moon
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenAuth,
  theme,
  onToggleTheme,
}) => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top Navigation */}
      <nav style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo.png"
            alt="Team-Up"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              objectFit: 'cover',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
            }}
          />
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Team-Up
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', borderRadius: '20px' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} style={{ color: '#f59e0b' }} /> : <Moon size={15} style={{ color: '#6366f1' }} />}
            <span style={{ fontSize: '12px' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button onClick={onOpenAuth} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            Sign In
          </button>
          <button onClick={onOpenAuth} className="btn btn-primary" style={{ padding: '8px 18px' }}>
            Enter Workspace
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '20px',
          color: 'var(--text-primary)'
        }}>
          Coordinate operational work across hundreds of employees{' '}
          <span style={{
            background: 'linear-gradient(135deg, #3b82f6 20%, #a855f7 80%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            without the collisions.
          </span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '720px',
          margin: '0 auto 36px'
        }}>
          Informal chat messages, spreadsheets, and emails break down as your company scales. 
          <strong> Team-Up</strong> eliminates duplicate work, prevents mid-air stale overwrites, 
          and enforces gated approvals with an immutable audit trail.
        </p>

        {/* CTA Group */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenAuth}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '10px' }}
          >
            Launch Operations Workspace
            <ArrowRight size={17} />
          </button>
          <button
            onClick={onOpenAuth}
            className="btn btn-secondary"
            style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '10px' }}
          >
            Sign In / Register Account
          </button>
        </div>

        {/* Live Metrics Proof */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '60px',
          padding: '24px',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>100% Atomic</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Claim Race Condition Protection</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>Optimistic Locking</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Zero Silent Data Overwrites (OCC)</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#8b5cf6' }}>Server-Side RBAC</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Gated Team Lead Approvals</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>AI Smart Triage</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Automated Gemini Categorization</div>
          </div>
        </div>
      </section>

      {/* The Problem vs Solution (Chaos vs Team-Up) */}
      <section style={{ maxWidth: '1100px', margin: '40px auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Why Informal Operational Workflows Fail
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            What worked for a 10-person startup creates critical operational blindspots with hundreds of employees.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left: The Old Way (The Problem) */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '20px' }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>The Fragmented Chaos</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>1. Work Collisions:</strong> Two employees unknowingly start investigating the same fraud report or customer incident at the exact same time.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>2. Stale Mid-Air Overwrites:</strong> User A saves changes while User B was looking at an older version, silently wiping out User A's work.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>3. Lost in Chat Threads:</strong> Urgent production tickets get buried in Slack or email chains without clear accountability.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>4. Zero Management Visibility:</strong> Leaders have no reliable way to understand who owns what or why a decision was made.
              </div>
            </div>
          </div>

          {/* Right: The Team-Up Way (The Solution) */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '20px' }}>
              <ShieldCheck size={20} />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>The Team-Up Guarantee</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>1. Atomic Claiming:</strong> Conditional database locks ensure exactly one person takes ownership. Competing claims receive instant friendly collisions.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>2. Optimistic Concurrency Control (OCC):</strong> Stale edits are rejected with a side-by-side visual diff so no changes are ever lost.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>3. Gated Approvals:</strong> High-risk payouts and compliance actions require explicit sign-off from authorized Team Leads.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>4. Immutable Audit Trail:</strong> Every state change, assignment handoff, and decision is permanently recorded with actor diffs.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '32px 24px',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)'
      }}>
        Team-Up Operational Coordination Platform • Built with FastAPI, PostgreSQL & React
      </footer>
    </div>
  );
};
