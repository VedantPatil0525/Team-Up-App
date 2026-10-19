import React from 'react';
import {
  ShieldCheck, ArrowRight, Layers, Users, History,
  Lock, AlertTriangle, CheckCircle2, Sparkles, Building2, Sun, Moon,
  Cpu, GitMerge, FileText, Check, Activity, Database, Scale, Workflow,
  Server, Shield, BellRing, KeyRound, Terminal, ChevronRight
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
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top Navigation */}
      <nav style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-primary)',
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        {/* Brand / Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
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
          <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Team-Up
          </span>
        </div>

        {/* Center Menu Links with Smooth Redirection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <button
            onClick={() => scrollTo('features')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('architecture')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Architecture
          </button>
          <button
            onClick={() => scrollTo('workflow')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Workflow
          </button>
          <button
            onClick={() => scrollTo('security')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Security
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
      <section id="hero" style={{
        maxWidth: '1040px',
        margin: '0 auto',
        padding: '72px 24px 50px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '24px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--primary)',
          marginBottom: '24px'
        }}>
          <Sparkles size={14} />
          <span>High-Concurrency Operational Work Coordination</span>
        </div>

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
          maxWidth: '740px',
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
      <section id="workflow" style={{ maxWidth: '1120px', margin: '40px auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            OPERATIONAL WORKFLOW GOVERNANCE
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
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
              <AlertTriangle size={22} />
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
              <ShieldCheck size={22} />
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

        {/* 4-Stage Operational Lifecycle Cards */}
        <div style={{ marginTop: '48px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', marginBottom: '24px' }}>
            The 4-Stage Operational Lifecycle
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>1</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Intake & Smart Triage</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Requests arrive, Gemini AI computes category and priority recommendations, and route tags are attached.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>2</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Atomic Ownership Claim</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Conditional SQL updates guarantee exactly one employee takes ownership, eliminating duplicate work.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#8b5cf620', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>3</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Gated Sign-Off</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Sensitive payouts or privacy tasks require explicit cryptographic sign-off from authorized Team Leads.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f59e0b20', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>4</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Resolution & Audit</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Tickets reach completion with an immutable, append-only audit event history preserving who changed what.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ maxWidth: '1120px', margin: '80px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            CORE CAPABILITIES
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Engineered for Concurrency, Reliability & Compliance
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '640px', margin: '0 auto' }}>
            Built specifically to solve high-frequency operational bottlenecks in growing organizations.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Card 1: Atomic Claiming */}
          <div style={{ background: 'var(--bg-secondary)', padding: '26px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Lock size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>Atomic Claim Race Prevention</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Conditional database updates (<code style={{ fontSize: '12px', color: 'var(--primary)' }}>WHERE assignee_id IS NULL</code>) guarantee that when two operators click "Take Ownership" at the same millisecond, exactly one succeeds and the other is safely notified.
            </p>
          </div>

          {/* Card 2: OCC */}
          <div style={{ background: 'var(--bg-secondary)', padding: '26px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <GitMerge size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>Optimistic Concurrency Control (OCC)</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Strict version sequence checks (<code style={{ fontSize: '12px', color: '#10b981' }}>version = version + 1</code>) prevent mid-air collision overwrites. Stale saves trigger an interactive side-by-side visual diff resolver so no work is ever silently lost.
            </p>
          </div>

          {/* Card 3: Server RBAC */}
          <div style={{ background: 'var(--bg-secondary)', padding: '26px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#8b5cf620', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>Server-Enforced RBAC & Approvals</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Department-scoped roles (<code style={{ fontSize: '12px', color: '#8b5cf6' }}>LEAD</code>, <code style={{ fontSize: '12px', color: '#8b5cf6' }}>MEMBER</code>, <code style={{ fontSize: '12px', color: '#8b5cf6' }}>OBSERVER</code>) enforced strictly at the API layer. Sensitive actions require explicit authorization, rejecting unauthorized attempts with HTTP 403.
            </p>
          </div>

          {/* Card 4: Immutable Audit Trail */}
          <div style={{ background: 'var(--bg-secondary)', padding: '26px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f59e0b20', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <History size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>Immutable Audit Event Ledger</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Every status transition, ownership change, and field edit is permanently logged in an append-only ledger storing actor identity, ISO timestamps, and granular previous vs new JSON diffs for compliance.
            </p>
          </div>

          {/* Card 5: AI Smart Triage */}
          <div style={{ background: 'var(--bg-secondary)', padding: '26px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ec489920', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>Gemini AI Smart Triage Copilot</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Integrated Google Gemini API analyzes ticket descriptions on submission, automatically suggesting accurate priority ratings (P0–P3), team routing categories, and root-cause hypotheses.
            </p>
          </div>

          {/* Card 6: Multi-Faceted Triage Queues */}
          <div style={{ background: 'var(--bg-secondary)', padding: '26px', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#06b6d420', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Layers size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>Real-Time Triage Lenses</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Instantly toggle between high-urgency lenses: "All Active Work", "Assigned to Me", "Awaiting Approval", "P0 Incidents", and "Unassigned Queue" with live server count badges.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Deep Dive */}
      <section id="architecture" style={{ maxWidth: '1120px', margin: '80px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            SYSTEM DESIGN
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Beyond CRUD: High-Throughput Architecture
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '640px', margin: '0 auto' }}>
            Designed with clean separation between synchronous ACID transactions and resilient asynchronous side-effects.
          </p>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '10px' }}>
                <Server size={18} />
                <span>FastAPI Async Engine</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Asynchronous Python 3.10+ REST API with Pydantic v2 data validation, dependency-injected security, and connection pooling via asyncpg.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, marginBottom: '10px' }}>
                <Database size={18} />
                <span>PostgreSQL (Supabase)</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                ACID relational guarantees with conditional SQL statements, composite indices, and JSONB storage for audit diffs.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontWeight: 700, marginBottom: '10px' }}>
                <Cpu size={18} />
                <span>Resilient Background Queue</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Decoupled queue worker with idempotency keys, max-retry tracking, and exponential backoff for webhooks and AI triage.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, marginBottom: '10px' }}>
                <Activity size={18} />
                <span>Deterministic State Machine</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Hardcoded transition graph: <code style={{ fontSize: '11px' }}>NEW &rarr; TRIAGED &rarr; IN_PROGRESS &rarr; PENDING_APPROVAL &rarr; RESOLVED</code>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Governance Section */}
      <section id="security" style={{ maxWidth: '1120px', margin: '80px auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            ENTERPRISE GOVERNANCE
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Security, Compliance & Audit Readiness
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '640px', margin: '0 auto' }}>
            Cryptographically sound authorization and complete non-repudiation built into every operational step.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <KeyRound size={22} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Google OAuth 2.0</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Standard OpenID Connect via Google Identity Services with server-side token verification against Google Tokeninfo API.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <ShieldCheck size={22} style={{ color: '#10b981', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Zero Trust Server RBAC</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              All permission checks are evaluated on the backend using user identity and team membership roles. No client-side bypass possible.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <FileText size={22} style={{ color: '#8b5cf6', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Tamper-Evident Logs</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Append-only audit trail prevents modification of past actions, satisfying SOC 2, HIPAA, and GDPR regulatory requirements.
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <Scale size={22} style={{ color: '#f59e0b', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Regulatory Sign-Offs</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Compliance audits, right-to-be-forgotten requests, and wire transfer approvals require explicit sign-off from authorized Team Leads.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto 80px',
        padding: '48px 32px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
        borderRadius: '20px',
        border: '1px solid var(--border-default)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '14px' }}>
          Ready to eliminate operational collisions?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto 28px' }}>
          Launch the Team-Up operational workspace to experience atomic claiming, OCC conflict resolution, and live persona-switching.
        </p>
        <button
          onClick={onOpenAuth}
          className="btn btn-primary"
          style={{ padding: '12px 32px', fontSize: '15px', borderRadius: '10px' }}
        >
          Launch Operations Workspace
          <ArrowRight size={17} />
        </button>
      </section>

      {/* Enterprise Multi-Column Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        padding: '56px 24px 32px'
      }}>
        <div style={{
          maxWidth: '1180px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '40px',
          marginBottom: '48px'
        }}>
          {/* Column 1: Brand & Status */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <img
                src="/logo.png"
                alt="Team-Up"
                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
              />
              <span style={{ fontSize: '18px', fontWeight: 800 }}>Team-Up</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '320px', marginBottom: '16px' }}>
              High-concurrency operational work coordination engine replacing spreadsheets and chat triage with server-enforced correctness.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              <span>Operational: All Systems Nominal</span>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h5 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Product
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span onClick={() => scrollTo('features')} style={{ cursor: 'pointer' }}>Features Overview</span>
              <span onClick={() => scrollTo('features')} style={{ cursor: 'pointer' }}>Atomic Claiming</span>
              <span onClick={() => scrollTo('features')} style={{ cursor: 'pointer' }}>OCC Concurrency</span>
              <span onClick={() => scrollTo('features')} style={{ cursor: 'pointer' }}>AI Smart Triage</span>
              <span onClick={onOpenAuth} style={{ cursor: 'pointer', color: 'var(--primary)' }}>Launch Workspace</span>
            </div>
          </div>

          {/* Column 3: Architecture */}
          <div>
            <h5 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Architecture
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span onClick={() => scrollTo('architecture')} style={{ cursor: 'pointer' }}>Beyond CRUD</span>
              <span onClick={() => scrollTo('architecture')} style={{ cursor: 'pointer' }}>FastAPI REST API</span>
              <span onClick={() => scrollTo('architecture')} style={{ cursor: 'pointer' }}>PostgreSQL Supabase</span>
              <span onClick={() => scrollTo('architecture')} style={{ cursor: 'pointer' }}>Background Queue</span>
              <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>OpenAPI / Swagger</a>
            </div>
          </div>

          {/* Column 4: Security */}
          <div>
            <h5 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Security
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span onClick={() => scrollTo('security')} style={{ cursor: 'pointer' }}>Server-Side RBAC</span>
              <span onClick={() => scrollTo('security')} style={{ cursor: 'pointer' }}>Immutable Audit</span>
              <span onClick={() => scrollTo('security')} style={{ cursor: 'pointer' }}>Google OAuth 2.0</span>
              <span onClick={() => scrollTo('security')} style={{ cursor: 'pointer' }}>Gated Approvals</span>
              <span onClick={() => scrollTo('security')} style={{ cursor: 'pointer' }}>SOC 2 Compliance</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal */}
        <div style={{
          maxWidth: '1180px',
          margin: '0 auto',
          paddingTop: '24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            © 2026 Team-Up Systems Inc. All rights reserved. Built with FastAPI, PostgreSQL & React.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Whitepaper</span>
            <a
              href="https://github.com/VedantPatil0525/Team-Up-App"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

