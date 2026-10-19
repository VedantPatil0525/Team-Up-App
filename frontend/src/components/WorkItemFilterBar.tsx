import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { Team } from '../types';

interface WorkItemFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedTeam: string;
  onTeamChange: (teamId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  teams: Team[];
  onReset: () => void;
}

export const WorkItemFilterBar: React.FC<WorkItemFilterBarProps> = ({
  search,
  onSearchChange,
  selectedTeam,
  onTeamChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  selectedCategory,
  onCategoryChange,
  teams,
  onReset,
}) => {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      marginBottom: '16px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Search Input */}
      <div style={{
        position: 'relative',
        flex: '1 1 240px',
        maxWidth: '360px'
      }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}
        />
        <input
          type="text"
          placeholder="Search by title, keywords, or error..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input"
          style={{ paddingLeft: '32px' }}
        />
      </div>

      {/* Filter Dropdowns */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {/* Team Filter */}
        <select
          value={selectedTeam}
          onChange={(e) => onTeamChange(e.target.value)}
          className="select"
          style={{ width: 'auto', minWidth: '140px' }}
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="select"
          style={{ width: 'auto' }}
        >
          <option value="">All Statuses</option>
          <option value="NEW">New (Triage)</option>
          <option value="TRIAGED">Triaged</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="select"
          style={{ width: 'auto' }}
        >
          <option value="">All Priorities</option>
          <option value="P0_CRITICAL">P0 - Critical</option>
          <option value="P1_HIGH">P1 - High</option>
          <option value="P2_MEDIUM">P2 - Medium</option>
          <option value="P3_LOW">P3 - Low</option>
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="select"
          style={{ width: 'auto' }}
        >
          <option value="">All Categories</option>
          <option value="INCIDENT">Incident</option>
          <option value="PAYMENT_REVIEW">Payment Review</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="CUSTOMER_ISSUE">Customer Issue</option>
          <option value="OPERATIONAL_TASK">Operational Task</option>
        </select>

        {/* Reset Button */}
        {(search || selectedTeam || selectedStatus || selectedPriority || selectedCategory) && (
          <button
            onClick={onReset}
            className="btn btn-secondary"
            style={{ padding: '8px 10px' }}
            title="Reset all filters"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
