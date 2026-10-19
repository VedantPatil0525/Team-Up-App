export type WorkItemCategory = 
  | 'INCIDENT'
  | 'PAYMENT_REVIEW'
  | 'COMPLIANCE'
  | 'CUSTOMER_ISSUE'
  | 'OPERATIONAL_TASK';

export type WorkItemPriority = 
  | 'P0_CRITICAL'
  | 'P1_HIGH'
  | 'P2_MEDIUM'
  | 'P3_LOW';

export type WorkItemStatus = 
  | 'NEW'
  | 'TRIAGED'
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'RESOLVED'
  | 'CANCELLED';

export type SystemRole = 'ADMIN' | 'MEMBER';
export type TeamRole = 'LEAD' | 'MEMBER' | 'OBSERVER';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface TeamMembership {
  team_id: string;
  team_name: string;
  team_slug: string;
  team_role: TeamRole;
}

export interface User extends UserSummary {
  system_role: SystemRole;
  teams: TeamMembership[];
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  team_role: TeamRole;
  user?: UserSummary;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  members: TeamMember[];
}

export interface AuditEvent {
  id: string;
  work_item_id: string;
  actor_id: string;
  action_type: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  context_note?: string;
  created_at: string;
  actor?: UserSummary;
}

export interface Comment {
  id: string;
  work_item_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: UserSummary;
}

export interface WorkItemListItem {
  id: string;
  title: string;
  category: WorkItemCategory;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  version: number;
  team_id: string;
  team_name?: string;
  assignee_id?: string;
  assignee_name?: string;
  reporter_id: string;
  reporter_name?: string;
  approval_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkItem extends WorkItemListItem {
  description: string;
  approved_by_id?: string;
  approved_at?: string;
  rejection_reason?: string;
  resolution_notes?: string;
  team?: { id: string; name: string; slug: string };
  assignee?: UserSummary;
  reporter?: UserSummary;
  approver?: UserSummary;
  audit_events: AuditEvent[];
  comments: Comment[];
}

export interface PaginatedWorkItemsResponse {
  items: WorkItemListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ConflictDetail {
  message: string;
  client_version: number;
  server_version: number;
  server_title?: string;
  server_priority?: string;
  server_description?: string;
}
