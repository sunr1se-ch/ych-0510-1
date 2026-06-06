export interface BuoyNode {
  nodeId: string;
  segment: string;
  depth: number;
  positionInSegment: number;
}

export interface SampleRecord {
  id?: number;
  nodeId: string;
  sampleTime: string;
  corrosionPotential: number;
  tideLevel: number;
}

export interface CorrosionRate {
  nodeId: string;
  segment: string;
  avgDailyRate: number;
  sampleCount: number;
  dateRange: [string, string];
  depth: number;
}

export interface TideDifference {
  segment: string;
  nodePair: [string, string];
  avgTideDiff: number;
  sampleCount: number;
}

export interface FilterParams {
  segments: string[];
  startDate: string;
  endDate: string;
}

export interface StatsOverview {
  nodeCount: number;
  sampleCount: number;
  avgCorrosionRate: number;
  maxTideDiff: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
