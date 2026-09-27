import {
  HealthResponse,
  Session,
  SessionDetailResponse,
  RunDetailResponse,
  LapDetailResponse,
  TelemetryResponse,
  TelemetryInspectionResult,
  IngestionResult,
  LapMetadataResponse,
  LapChannelsResponse,
  DataQualityResult,
  LapComparisonResponse,
} from '../types/domain';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, options);
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`API HTTP ${res.status}: ${errText}`);
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

  // Stage 2 Pipeline Methods
  async inspectTelemetry(file: File): Promise<TelemetryInspectionResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<TelemetryInspectionResult>('/api/telemetry/inspect', {
      method: 'POST',
      body: formData,
    });
  }

  async ingestTelemetry(
    file: File,
    sessionId: string,
    runId: string,
    lapId: string,
    lapNumber: number,
    lapTime: number,
    resampleStep = 1.0
  ): Promise<IngestionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    formData.append('run_id', runId);
    formData.append('lap_id', lapId);
    formData.append('lap_number', String(lapNumber));
    formData.append('lap_time', String(lapTime));
    formData.append('resample_step', String(resampleStep));

    return this.request<IngestionResult>('/api/telemetry/ingest', {
      method: 'POST',
      body: formData,
    });
  }

  async getLapMetadata(lapId: string): Promise<LapMetadataResponse> {
    return this.request<LapMetadataResponse>(`/api/telemetry/${lapId}/metadata`);
  }

  async getLapChannels(lapId: string): Promise<LapChannelsResponse> {
    return this.request<LapChannelsResponse>(`/api/telemetry/${lapId}/channels`);
  }

  async getLapQuality(lapId: string): Promise<DataQualityResult> {
    return this.request<DataQualityResult>(`/api/telemetry/${lapId}/quality`);
  }

  async getLapAligned(lapId: string, distanceStep = 1.0): Promise<TelemetryResponse> {
    return this.request<TelemetryResponse>(`/api/telemetry/${lapId}/aligned?distance_step=${distanceStep}`);
  }

  async compareLaps(
    referenceLapId: string,
    comparisonLapId: string,
    distanceStep = 1.0
  ): Promise<LapComparisonResponse> {
    return this.request<LapComparisonResponse>('/api/telemetry/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference_lap_id: referenceLapId,
        comparison_lap_id: comparisonLapId,
        distance_step: distanceStep,
      }),
    });
  }
}

export const api = new ApiService();
