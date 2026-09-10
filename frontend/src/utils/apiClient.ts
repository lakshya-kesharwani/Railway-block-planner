// src/utils/apiClient.ts
//
// Client for the unified FastAPI backend (railway-unified-backend):
//   - /auth/*         real MongoDB + JWT authentication
//   - /maintenance/*  real maintenance requests, rule-based priority engine,
//                     block planning, and the ML-bridge endpoint
//   - /ml/*           KALM Storm AI layer: XGBoost / Random Forest /
//                     Isolation Forest / delay model / OR-Tools scheduler
//
// Set VITE_API_BASE_URL in .env if the backend isn't on localhost:8000.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    // Network-level failure (backend not running, CORS blocked, offline, etc.)
    throw new ApiError(
      `Could not reach the backend at ${BASE_URL}. Is it running?`,
      0
    );
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body?.detail || detail;
    } catch {
      /* response wasn't JSON - keep statusText */
    }
    throw new ApiError(detail, response.status);
  }

  // Some endpoints (rare) may return an empty body
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ============================================================
// Auth (/auth/*)
// ============================================================

export type BackendUserRole = 'admin' | 'control_officer' | 'department_user';
export type BackendDepartment = 'Engineering' | 'Traction' | 'Signal_Telecom';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: BackendUserRole;
  department: BackendDepartment | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

export function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(data: {
  name: string;
  email: string;
  password: string;
  role: BackendUserRole;
  department?: BackendDepartment | null;
}): Promise<BackendUser> {
  return apiFetch<BackendUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMe(token: string): Promise<BackendUser> {
  return apiFetch<BackendUser>('/auth/me', {}, token);
}

// ============================================================
// Maintenance (/maintenance/*) - real Mongo-backed requests,
// rule-based priority engine, block planner
// ============================================================

export interface MaintenanceRequestCreatePayload {
  department: BackendDepartment;
  assetId: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  deadline?: string | null;
}

export function createMaintenanceRequestApi(
  token: string,
  data: MaintenanceRequestCreatePayload
) {
  return apiFetch('/maintenance/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export function getMaintenanceRequestsApi(token: string) {
  return apiFetch('/maintenance/requests', {}, token);
}

export function analyzeMaintenanceRequestApi(token: string, requestId: string) {
  return apiFetch(`/maintenance/analyze/${requestId}`, {}, token);
}

/** Runs BOTH the rule-based engine and the ML pipeline on the same real request. */
export function analyzeMaintenanceRequestWithMlApi(token: string, requestId: string) {
  return apiFetch(`/maintenance/analyze-ml/${requestId}`, {}, token);
}

export function generateBlockPlanApi(token: string) {
  return apiFetch('/maintenance/plan', {}, token);
}

export function updateBlockStatusApi(
  token: string,
  blockId: string,
  status: 'Approved' | 'Rejected'
) {
  return apiFetch(`/maintenance/blocks/${blockId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }, token);
}

// ============================================================
// ML / OR-Tools (/ml/*) - KALM Storm AI layer (no auth required)
// ============================================================

export interface MlAssetFeatures {
  asset_age_years: number;
  recent_defects: number;
  historical_failures: number;
  maintenance_overdue_days: number;
  days_since_last_maintenance: number;
  traffic_intensity: number;
  asset_criticality: number;
  failure_frequency: number;
  maintenance_frequency: number;
  load_factor: number;
  environmental_risk: number;
  weather_risk: number;
}

export function predictRiskApi(data: MlAssetFeatures & { anomaly_score: number }) {
  return apiFetch('/ml/predict-risk', { method: 'POST', body: JSON.stringify(data) });
}

export function predictPriorityApi(data: MlAssetFeatures & { risk_score: number; anomaly_score: number }) {
  return apiFetch('/ml/predict-priority', { method: 'POST', body: JSON.stringify(data) });
}

export function predictDelayApi(data: {
  maintenance_duration_min: number;
  affected_trains: number;
  congestion_level: number;
  traffic_intensity: number;
  load_factor: number;
  weather_risk: number;
}) {
  return apiFetch('/ml/predict-delay', { method: 'POST', body: JSON.stringify(data) });
}

export function analyzeMaintenanceMlApi(data: MlAssetFeatures & {
  maintenance_duration_min: number;
  affected_trains: number;
  congestion_level: number;
}) {
  return apiFetch('/ml/analyze-maintenance', { method: 'POST', body: JSON.stringify(data) });
}

export interface MlScheduleTask extends Partial<MlAssetFeatures> {
  id: string;
  asset_id: string;
  department: string;
  section_id: string;
  maintenance_duration_min?: number;
  affected_trains?: number;
  congestion_level?: number;
}

export interface MlTrainSchedule {
  train_id: string;
  section_id: string;
  start_minute: number;
  end_minute: number;
}

export function generateScheduleMlApi(tasks: MlScheduleTask[], trains: MlTrainSchedule[] = []) {
  return apiFetch('/ml/generate-schedule', {
    method: 'POST',
    body: JSON.stringify({ tasks, trains }),
  });
}

export function whatIfScheduleMlApi(
  tasks: MlScheduleTask[],
  trains: MlTrainSchedule[],
  unavailable_blocks: string[] = []
) {
  return apiFetch('/ml/what-if', {
    method: 'POST',
    body: JSON.stringify({ tasks, trains, unavailable_blocks }),
  });
}

export function stormModeMlApi(data: {
  incident_type: string;
  section_id: string;
  tasks: MlScheduleTask[];
  trains: MlTrainSchedule[];
  previous_schedule?: Record<string, unknown>[];
}) {
  return apiFetch('/ml/storm-mode', { method: 'POST', body: JSON.stringify(data) });
}
