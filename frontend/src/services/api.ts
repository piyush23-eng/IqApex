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
  CircuitCornerDefinition,
  CornerMetric,
  LapComparisonSummary,
  AlignedChannelsResponse,
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

  // Stage 3 Analysis Workstation Methods
  async getCircuitCorners(circuit = 'monza'): Promise<CircuitCornerDefinition[]> {
    return this.request<CircuitCornerDefinition[]>(`/api/analysis/corners/${encodeURIComponent(circuit)}`);
  }

  async getLapComparisonSummary(refLapId: string, compLapId: string): Promise<LapComparisonSummary> {
    return this.request<LapComparisonSummary>(
      `/api/analysis/compare/summary?ref_lap_id=${encodeURIComponent(refLapId)}&comp_lap_id=${encodeURIComponent(compLapId)}`
    );
  }

  async getCornerComparison(
    refLapId: string,
    compLapId: string,
    sortBy = 'turn_number',
    sortOrder = 'asc'
  ): Promise<CornerMetric[]> {
    return this.request<CornerMetric[]>(
      `/api/analysis/compare/corners?ref_lap_id=${encodeURIComponent(refLapId)}&comp_lap_id=${encodeURIComponent(compLapId)}&sort_by=${sortBy}&sort_order=${sortOrder}`
    );
  }

  async getAlignedChannels(
    refLapId: string,
    compLapId: string,
    distanceStep = 1.0
  ): Promise<AlignedChannelsResponse> {
    return this.request<AlignedChannelsResponse>(
      `/api/analysis/compare/aligned-channels?ref_lap_id=${encodeURIComponent(refLapId)}&comp_lap_id=${encodeURIComponent(compLapId)}&distance_step=${distanceStep}`
    );
  }

  // Stage 4 Lap-Time Decomposition & Statistics Methods
  async getLapDecomposition(
    compLapId: string,
    refLapId?: string,
    referenceMethod = 'selected_lap',
    sessionId = 'demo-session-monza-2026',
    driverId?: string
  ): Promise<import('../types/decomposition').LapDecompositionResult> {
    const params = new URLSearchParams({
      comp_lap_id: compLapId,
      reference_method: referenceMethod,
      session_id: sessionId,
    });
    if (refLapId) params.append('ref_lap_id', refLapId);
    if (driverId) params.append('driver_id', driverId);

    return this.request<import('../types/decomposition').LapDecompositionResult>(
      `/api/analysis/decomposition?${params.toString()}`
    );
  }

  async getRepeatedLapsStatistics(
    sessionId = 'demo-session-monza-2026',
    driverId?: string,
    metric = 'lap_time'
  ): Promise<import('../types/decomposition').RepeatedLapsStatisticsResponse> {
    const params = new URLSearchParams({ session_id: sessionId, metric });
    if (driverId) params.append('driver_id', driverId);

    return this.request<import('../types/decomposition').RepeatedLapsStatisticsResponse>(
      `/api/analysis/statistics/repeated-laps?${params.toString()}`
    );
  }

  async getCorrelation(
    sessionId = 'demo-session-monza-2026',
    featureX = 'sector_1',
    featureY = 'lap_time'
  ): Promise<import('../types/decomposition').CorrelationResult> {
    const params = new URLSearchParams({
      session_id: sessionId,
      feature_x: featureX,
      feature_y: featureY,
    });
    return this.request<import('../types/decomposition').CorrelationResult>(
      `/api/analysis/statistics/correlation?${params.toString()}`
    );
  }

  async getRegression(
    sessionId = 'demo-session-monza-2026',
    featureMetric = 'tyre_age',
    targetMetric = 'lap_time',
    driverId?: string
  ): Promise<import('../types/decomposition').RegressionResult> {
    const params = new URLSearchParams({
      session_id: sessionId,
      feature_metric: featureMetric,
      target_metric: targetMetric,
    });
    if (driverId) params.append('driver_id', driverId);

    return this.request<import('../types/decomposition').RegressionResult>(
      `/api/analysis/statistics/regression?${params.toString()}`
    );
  }

  async getSensitivity(
    refLapId = 'lap-demo-02',
    compLapId = 'lap-demo-03'
  ): Promise<import('../types/decomposition').SensitivityItem[]> {
    return this.request<import('../types/decomposition').SensitivityItem[]>(
      `/api/analysis/statistics/sensitivity?ref_lap_id=${encodeURIComponent(refLapId)}&comp_lap_id=${encodeURIComponent(compLapId)}`
    );
  }

  // Stage 5 Performance Sensitivity & Optimization Engine Methods
  async getParameters(): Promise<import('../types/optimization').ParameterDefinition[]> {
    return this.request<import('../types/optimization').ParameterDefinition[]>('/api/optimization/parameters');
  }

  async getResponseCurve(
    sessionId = 'demo-session-monza-2026',
    cornerId = 'T9',
    parameterName = 'corner_exit_speed',
    targetName = 'corner_time',
    baselineValue = 181.2,
    scenarioValue = 183.0
  ): Promise<import('../types/optimization').ResponseCurveResponse> {
    const params = new URLSearchParams({
      session_id: sessionId,
      corner_id: cornerId,
      parameter_name: parameterName,
      target_name: targetName,
      baseline_value: String(baselineValue),
      scenario_value: String(scenarioValue),
    });
    return this.request<import('../types/optimization').ResponseCurveResponse>(
      `/api/optimization/response-curve?${params.toString()}`
    );
  }

  async getResponseSurface2D(
    sessionId = 'demo-session-monza-2026',
    cornerId = 'T9',
    featureX1 = 'corner_minimum_speed',
    featureX2 = 'corner_exit_speed',
    targetName = 'corner_time'
  ): Promise<import('../types/optimization').ResponseSurface2DResponse> {
    const params = new URLSearchParams({
      session_id: sessionId,
      corner_id: cornerId,
      feature_x1: featureX1,
      feature_x2: featureX2,
      target_name: targetName,
    });
    return this.request<import('../types/optimization').ResponseSurface2DResponse>(
      `/api/optimization/response-surface-2d?${params.toString()}`
    );
  }

  async getParameterSweep(
    sessionId = 'demo-session-monza-2026',
    cornerId = 'T9',
    parameterName = 'corner_exit_speed',
    targetName = 'corner_time',
    baselineValue = 181.2
  ): Promise<import('../types/optimization').ParameterSweepResponse> {
    const params = new URLSearchParams({
      session_id: sessionId,
      corner_id: cornerId,
      parameter_name: parameterName,
      target_name: targetName,
      baseline_value: String(baselineValue),
    });
    return this.request<import('../types/optimization').ParameterSweepResponse>(
      `/api/optimization/sweep?${params.toString()}`
    );
  }

  async runMonteCarlo(
    req: import('../types/optimization').MonteCarloSimulationRequest
  ): Promise<import('../types/optimization').MonteCarloSimulationResponse> {
    return this.request<import('../types/optimization').MonteCarloSimulationResponse>(
      '/api/optimization/monte-carlo',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  async runOptimization(
    req: import('../types/optimization').ConstrainedOptimizationRequest
  ): Promise<import('../types/optimization').ConstrainedOptimizationResponse> {
    return this.request<import('../types/optimization').ConstrainedOptimizationResponse>(
      '/api/optimization/optimize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  async getSensitivityMatrix(
    sessionId = 'demo-session-monza-2026'
  ): Promise<import('../types/optimization').SensitivityMatrixResponse> {
    return this.request<import('../types/optimization').SensitivityMatrixResponse>(
      `/api/sensitivity/matrix?session_id=${encodeURIComponent(sessionId)}`
    );
  }

  // --- STAGE 6: VEHICLE PERFORMANCE & AERO SURROGATE APIS ---

  async getVehicleParameters(): Promise<import('../types/vehiclePerformance').ParameterListResponse> {
    return this.request<import('../types/vehiclePerformance').ParameterListResponse>(
      '/api/vehicle-performance/parameters'
    );
  }

  async evaluateVehicleConfig(
    config: import('../types/vehiclePerformance').VehicleConfig
  ): Promise<import('../types/vehiclePerformance').AeroEvaluationResponse> {
    return this.request<import('../types/vehiclePerformance').AeroEvaluationResponse>(
      '/api/vehicle-performance/evaluate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }
    );
  }

  async compareVehicleConfigs(
    baseline: import('../types/vehiclePerformance').VehicleConfig,
    scenario: import('../types/vehiclePerformance').VehicleConfig
  ): Promise<import('../types/vehiclePerformance').VehicleComparisonResponse> {
    return this.request<import('../types/vehiclePerformance').VehicleComparisonResponse>(
      '/api/vehicle-performance/compare',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseline, scenario }),
      }
    );
  }

  async getAeroParetoFrontier(
    maxPoints = 120
  ): Promise<import('../types/vehiclePerformance').ParetoFrontierResponse> {
    return this.request<import('../types/vehiclePerformance').ParetoFrontierResponse>(
      `/api/vehicle-performance/pareto-frontier?max_points=${maxPoints}`
    );
  }

  async getAeroResponseSurface2D(
    target = 'downforce_n',
    xFeature = 'front_wing_angle',
    yFeature = 'rear_wing_angle',
    gridResolution = 25
  ): Promise<import('../types/vehiclePerformance').ResponseSurface2DVehicleResponse> {
    const params = new URLSearchParams({
      target,
      x_feature: xFeature,
      y_feature: yFeature,
      grid_resolution: String(gridResolution),
    });
    return this.request<import('../types/vehiclePerformance').ResponseSurface2DVehicleResponse>(
      `/api/vehicle-performance/response-surface-2d?${params.toString()}`
    );
  }

  async simulateTrackPerformance(
    config: import('../types/vehiclePerformance').VehicleConfig
  ): Promise<import('../types/vehiclePerformance').TrackSimulationResponse> {
    return this.request<import('../types/vehiclePerformance').TrackSimulationResponse>(
      '/api/vehicle-performance/track-simulation',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }
    );
  }

  async runAeroMonteCarlo(
    config: import('../types/vehiclePerformance').VehicleConfig,
    iterations = 500,
    seed = 42871
  ): Promise<import('../types/vehiclePerformance').AeroMonteCarloResponse> {
    return this.request<import('../types/vehiclePerformance').AeroMonteCarloResponse>(
      '/api/vehicle-performance/monte-carlo',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          iterations,
          simulation_seed: seed,
        }),
      }
    );
  }
}

export const api = new ApiService();

