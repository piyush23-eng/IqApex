import {
  HealthResponse,
  Session,
  SessionDetailResponse,
  RunDetailResponse,
  LapDetailResponse,
  TelemetryResponse,
} from '../types/domain';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiService {
  private async request<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API HTTP ${res.status}: ${res.statusText} at ${endpoint}`);
    }
    return res.json() as Promise<T>;
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health');
  }

  async getSessions(includeDemo = true): Promise<Session[]> {
    return this.request<Session[]>(`/api/sessions?include_demo=${includeDemo}`);
  }

  async getSession(sessionId: string): Promise<SessionDetailResponse> {
    return this.request<SessionDetailResponse>(`/api/sessions/${sessionId}`);
  }

  async getRun(runId: string): Promise<RunDetailResponse> {
    return this.request<RunDetailResponse>(`/api/runs/${runId}`);
  }

  async getLap(lapId: string): Promise<LapDetailResponse> {
    return this.request<LapDetailResponse>(`/api/laps/${lapId}`);
  }

  async getTelemetry(lapId: string, downsample?: number): Promise<TelemetryResponse> {
    const query = downsample ? `?downsample=${downsample}` : '';
    return this.request<TelemetryResponse>(`/api/telemetry/${lapId}${query}`);
  }
}

export const api = new ApiService();
