import type {
  MemberProfile,
  RouteFormValues,
  RunFormValues,
  RunSummary,
  SavedRoute,
} from '../types/run';

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string'
        ? payload.error
        : 'Request failed. Please try again.',
    );
  }
  return payload as T;
}

export async function fetchSavedRoutes(
  token?: string | null,
): Promise<SavedRoute[]> {
  const data = await apiRequest<{ routes: SavedRoute[] }>(
    '/api/routes',
    { method: 'GET' },
    token,
  );
  return data.routes;
}

export async function saveClubRoute(
  values: RouteFormValues,
  token: string,
): Promise<void> {
  await apiRequest(
    '/api/routes',
    {
      method: 'POST',
      body: JSON.stringify(values),
    },
    token,
  );
}

export async function deleteClubRoute(
  routeId: number,
  token: string,
): Promise<void> {
  await apiRequest(`/api/routes/${routeId}`, { method: 'DELETE' }, token);
}

export async function fetchUpcomingRuns(
  filters: { type?: string; terrain?: string },
  token?: string | null,
): Promise<RunSummary[]> {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== 'All') {
    params.set('type', filters.type);
  }
  if (filters.terrain && filters.terrain !== 'All') {
    params.set('terrain', filters.terrain);
  }
  const query = params.toString();
  const data = await apiRequest<{ runs: RunSummary[] }>(
    `/api/runs${query ? `?${query}` : ''}`,
    { method: 'GET' },
    token,
  );
  return data.runs;
}

export async function postNewRun(
  values: RunFormValues,
  token: string,
): Promise<void> {
  await apiRequest(
    '/api/runs',
    {
      method: 'POST',
      body: JSON.stringify(values),
    },
    token,
  );
}

export async function updateExistingRun(
  runId: number,
  values: RunFormValues,
  token: string,
): Promise<void> {
  await apiRequest(
    `/api/runs/${runId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(values),
    },
    token,
  );
}

export async function cancelRun(runId: number, token: string): Promise<void> {
  await apiRequest(`/api/runs/${runId}`, { method: 'DELETE' }, token);
}

export async function joinClubRun(runId: number, token: string): Promise<void> {
  await apiRequest(`/api/runs/${runId}/rsvp`, { method: 'POST' }, token);
}

export async function leaveClubRun(
  runId: number,
  token: string,
): Promise<void> {
  await apiRequest(`/api/runs/${runId}/rsvp`, { method: 'DELETE' }, token);
}

export async function fetchMyProfile(token: string): Promise<MemberProfile> {
  const data = await apiRequest<{ member: MemberProfile }>(
    '/api/me',
    { method: 'GET' },
    token,
  );
  return data.member;
}

export async function updateMyProfile(
  updates: { displayName?: string; preferredPace?: string },
  token: string,
): Promise<MemberProfile> {
  const data = await apiRequest<{ member: MemberProfile }>(
    '/api/me',
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    token,
  );
  return data.member;
}
