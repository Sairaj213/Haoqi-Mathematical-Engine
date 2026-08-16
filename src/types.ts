export type TabMode = 'calc' | 'graph' | 'matrix' | 'calculus' | 'bits' | 'stats';

export type AngleUnit = 'rad' | 'deg';

export type AppTheme = 'light' | 'obsidian' | 'blueprint' | 'amber';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  exactResult?: string;
  timestamp: number;
  durationUs: number;
  mode: string;
  steps?: string[];
  variables?: Record<string, string>;
}

export interface GraphFunction {
  id: string;
  name: string;
  expr: string;
  color: string;
  visible: boolean;
  derivativeVisible?: boolean;
  integralVisible?: boolean;
}

export interface MatrixData {
  rows: number;
  cols: number;
  data: number[][];
}

export interface SystemTelemetry {
  fps: number;
  latencyMs: number;
  memoryUsageMb: number;
  coordinates: string;
  uptimeSeconds: number;
}
