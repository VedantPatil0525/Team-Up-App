import {
  User,
  Team,
  WorkItem,
  WorkItemListItem,
  PaginatedWorkItemsResponse,
  ConflictDetail,
} from '../types';

let currentUserId: string | null = null;

export const setActiveUserId = (userId: string | null) => {
  currentUserId = userId;
  if (userId) {
    localStorage.setItem('team_up_active_user_id', userId);
  } else {
    localStorage.removeItem('team_up_active_user_id');
  }
};

export const getSavedUserId = (): string | null => {
  return localStorage.getItem('team_up_active_user_id');
};

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const userId = currentUserId || getSavedUserId();
  if (userId) {
    headers.set('X-User-Id', userId);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail: any;
    try {
      errorDetail = await response.json();
    } catch {
      errorDetail = { detail: response.statusText };
    }

    const err = new Error(
      typeof errorDetail.detail === 'string'
        ? errorDetail.detail
        : errorDetail.detail?.message || 'API request failed'
    ) as Error & { status: number; conflictData?: ConflictDetail; rawDetail?: any };

    err.status = response.status;
    err.rawDetail = errorDetail.detail;

    if (response.status === 409 && typeof errorDetail.detail === 'object') {
      err.conflictData = errorDetail.detail;
    }

    throw err;
  }

  return response.json();
}

export const api = {
  // Auth & Personas
  getPersonas: () => apiRequest<User[]>('/api/v1/auth/users'),
  getCurrentPersona: () => apiRequest<User>('/api/v1/auth/me'),
  createUser: (data: { name: string; email: string; avatar_url?: string; system_role?: string }) =>
    apiRequest<User>('/api/v1/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  loginWithGoogle: (data: { id_token?: string; email?: string; name?: string; avatar_url?: string; team_id?: string }) =>
    apiRequest<User>('/api/v1/auth/google', { method: 'POST', body: JSON.stringify(data) }),

  // Teams & Organization
  getTeams: () => apiRequest<Team[]>('/api/v1/teams'),
  createTeam: (data: { name: string; slug?: string; description?: string }) =>
    apiRequest<Team>('/api/v1/teams', { method: 'POST', body: JSON.stringify(data) }),
  addTeamMember: (teamId: string, data: { user_id: string; team_role: string }) =>
    apiRequest<Team>(`/api/v1/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify(data) }),

  // Work Items
  getWorkItems: (params: {
    page?: number;
    page_size?: number;
    team_id?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignee_id?: string;
    unassigned_only?: boolean;
    pending_approval_only?: boolean;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());
    if (params.team_id) query.set('team_id', params.team_id);
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.category) query.set('category', params.category);
    if (params.assignee_id) query.set('assignee_id', params.assignee_id);
    if (params.unassigned_only) query.set('unassigned_only', 'true');
    if (params.pending_approval_only) query.set('pending_approval_only', 'true');
    if (params.search) query.set('search', params.search);

    return apiRequest<PaginatedWorkItemsResponse>(`/api/v1/work-items?${query.toString()}`);
  },

  getWorkItem: (id: string) => apiRequest<WorkItem>(`/api/v1/work-items/${id}`),

  createWorkItem: (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
    team_id: string;
    approval_required?: boolean;
  }) => apiRequest<WorkItem>('/api/v1/work-items', { method: 'POST', body: JSON.stringify(data) }),

  claimWorkItem: (id: string, note?: string) =>
    apiRequest<WorkItem>(`/api/v1/work-items/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  updateWorkItem: (
    id: string,
    data: {
      version: number;
      title?: string;
      description?: string;
      priority?: string;
      team_id?: string;
      approval_required?: boolean;
      edit_reason?: string;
    }
  ) => apiRequest<WorkItem>(`/api/v1/work-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  transitionWorkItem: (
    id: string,
    data: {
      version: number;
      target_status: string;
      resolution_notes?: string;
      reason?: string;
    }
  ) =>
    apiRequest<WorkItem>(`/api/v1/work-items/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approveWorkItem: (
    id: string,
    data: {
      version: number;
      approved: boolean;
      reason?: string;
    }
  ) =>
    apiRequest<WorkItem>(`/api/v1/work-items/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addComment: (id: string, content: string) =>
    apiRequest<Comment>(`/api/v1/work-items/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  aiAutoTriage: (title: string, description: string) =>
    apiRequest<{
      suggested_priority: string;
      suggested_category: string;
      reasoning: string;
      risk_factors: string[];
    }>('/api/v1/work-items/ai-triage', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),
};
