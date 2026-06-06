import { create } from 'zustand';
import {
  BuoyNode,
  CorrosionRate,
  TideDifference,
  StatsOverview,
  FilterParams,
  ImportResult,
} from '../../shared/types.js';

interface DashboardState {
  nodes: BuoyNode[];
  segments: string[];
  corrosionRates: CorrosionRate[];
  tideDiffs: TideDifference[];
  stats: StatsOverview | null;
  filter: FilterParams;
  loading: boolean;
  error: string | null;
  importResult: ImportResult | null;

  setFilter: (filter: Partial<FilterParams>) => void;
  fetchSegments: () => Promise<void>;
  fetchNodes: () => Promise<void>;
  fetchCorrosionRates: () => Promise<void>;
  fetchTideDiffs: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  importSamples: (file: File) => Promise<ImportResult>;
  exportData: () => Promise<void>;
  clearImportResult: () => void;
}

const getDefaultFilter = (): FilterParams => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    segments: [],
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

function buildQueryParams(filter: FilterParams): string {
  const params = new URLSearchParams();
  if (filter.segments.length > 0) {
    params.set('segments', filter.segments.join(','));
  }
  params.set('startDate', filter.startDate);
  params.set('endDate', filter.endDate);
  return params.toString();
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  nodes: [],
  segments: [],
  corrosionRates: [],
  tideDiffs: [],
  stats: null,
  filter: getDefaultFilter(),
  loading: false,
  error: null,
  importResult: null,

  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
  },

  fetchSegments: async () => {
    try {
      const res = await fetch('/api/segments');
      const data = await res.json();
      if (data.success) {
        set({ segments: data.data });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchNodes: async () => {
    try {
      const res = await fetch('/api/nodes');
      const data = await res.json();
      if (data.success) {
        set({ nodes: data.data });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchCorrosionRates: async () => {
    try {
      set({ loading: true });
      const { filter } = get();
      const res = await fetch(`/api/analysis/corrosion-rate?${buildQueryParams(filter)}`);
      const data = await res.json();
      if (data.success) {
        set({ corrosionRates: data.data, error: null });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTideDiffs: async () => {
    try {
      const { filter } = get();
      const res = await fetch(`/api/analysis/tide-difference?${buildQueryParams(filter)}`);
      const data = await res.json();
      if (data.success) {
        set({ tideDiffs: data.data });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchStats: async () => {
    try {
      const { filter } = get();
      const res = await fetch(`/api/analysis/stats?${buildQueryParams(filter)}`);
      const data = await res.json();
      if (data.success) {
        set({ stats: data.data });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchAllData: async () => {
    set({ loading: true });
    try {
      await Promise.all([
        get().fetchSegments(),
        get().fetchNodes(),
        get().fetchCorrosionRates(),
        get().fetchTideDiffs(),
        get().fetchStats(),
      ]);
    } finally {
      set({ loading: false });
    }
  },

  importSamples: async (file: File): Promise<ImportResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import/samples', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      set({ importResult: result });
      if (result.success) {
        await get().fetchAllData();
      }
      return result;
    } catch (err) {
      const result: ImportResult = {
        success: false,
        imported: 0,
        errors: [(err as Error).message],
      };
      set({ importResult: result });
      return result;
    }
  },

  exportData: async () => {
    try {
      const { filter } = get();
      const res = await fetch(`/api/export/data?${buildQueryParams(filter)}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `observatory_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearImportResult: () => set({ importResult: null }),
}));
