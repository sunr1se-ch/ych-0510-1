import { useState } from 'react';
import { Search, RotateCcw, ChevronDown } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { cn } from '../lib/utils.js';

export function FilterBar() {
  const { filter, segments, setFilter, fetchAllData } = useDashboardStore();
  const [segmentDropdownOpen, setSegmentDropdownOpen] = useState(false);

  const handleSegmentToggle = (segment: string) => {
    const current = filter.segments.includes(segment)
      ? filter.segments.filter(s => s !== segment)
      : [...filter.segments, segment];
    setFilter({ segments: current });
  };

  const handleReset = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setFilter({
      segments: [],
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
    setTimeout(fetchAllData, 50);
  };

  const handleQuery = () => {
    fetchAllData();
  };

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200 min-w-[60px]">链段</span>
          <div className="relative">
            <button
              onClick={() => setSegmentDropdownOpen(!segmentDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-200 hover:border-cyan-500/50 transition-all min-w-[180px] justify-between"
            >
              <span>
                {filter.segments.length === 0
                  ? '全部链段'
                  : `已选 ${filter.segments.length} 个`}
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                segmentDropdownOpen && "rotate-180"
              )} />
            </button>
            {segmentDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-slate-800/95 border border-slate-600/50 rounded-lg shadow-xl backdrop-blur-sm z-50 overflow-hidden">
                {segments.map(segment => (
                  <label
                    key={segment}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filter.segments.includes(segment)}
                      onChange={() => handleSegmentToggle(segment)}
                      className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-slate-200">链段 {segment}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200 min-w-[60px]">日期</span>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter({ startDate: e.target.value })}
            className="px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-cyan-500 focus:outline-none transition-colors"
          />
          <span className="text-slate-400">至</span>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ endDate: e.target.value })}
            className="px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-sm text-slate-300 transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleQuery}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/20"
          >
            <Search className="w-4 h-4" />
            查询
          </button>
        </div>
      </div>
    </div>
  );
}
