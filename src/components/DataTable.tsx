import { useMemo, useState } from 'react';
import { ArrowUpDown, Download, Upload } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { cn } from '../lib/utils.js';

type SortField = 'nodeId' | 'segment' | 'avgDailyRate' | 'depth' | 'sampleCount';
type SortOrder = 'asc' | 'desc';

export function DataTable() {
  const { corrosionRates, tideDiffs, filter, importSamples, importResult, clearImportResult, exportData } = useDashboardStore();
  const [sortField, setSortField] = useState<SortField>('nodeId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeTab, setActiveTab] = useState<'corrosion' | 'tide'>('corrosion');
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedRates = useMemo(() => {
    return [...corrosionRates].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'nodeId':
          comparison = a.nodeId.localeCompare(b.nodeId);
          break;
        case 'segment':
          comparison = a.segment.localeCompare(b.segment);
          break;
        case 'avgDailyRate':
          comparison = a.avgDailyRate - b.avgDailyRate;
          break;
        case 'depth':
          comparison = a.depth - b.depth;
          break;
        case 'sampleCount':
          comparison = a.sampleCount - b.sampleCount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [corrosionRates, sortField, sortOrder]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importSamples(file);
      e.target.value = '';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={cn(
      "w-3 h-3 ml-1 transition-colors",
      sortField === field ? "text-cyan-400" : "text-slate-500"
    )} />
  );

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
            详细数据
          </h3>
          <div className="flex bg-slate-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('corrosion')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activeTab === 'corrosion'
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              腐蚀变化率
            </button>
            <button
              onClick={() => setActiveTab('tide')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                activeTab === 'tide'
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              潮位差
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef[0] as any}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef[0]?.click?.()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-sm text-slate-300 transition-all hover:scale-[1.02]"
          >
            <Upload className="w-4 h-4" />
            导入采样
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      {importResult && (
        <div className={cn(
          "mb-4 p-3 rounded-lg text-sm",
          importResult.success
            ? "bg-green-500/20 border border-green-500/30 text-green-400"
            : "bg-red-500/20 border border-red-500/30 text-red-400"
        )}>
          <div className="flex items-center justify-between">
            <span>
              {importResult.success
                ? `成功导入 ${importResult.imported} 条记录`
                : `导入失败: ${importResult.errors[0]}`}
            </span>
            <button
              onClick={clearImportResult}
              className="text-xs hover:underline"
            >
              关闭
            </button>
          </div>
          {importResult.errors.length > 0 && importResult.success && (
            <div className="mt-2 text-xs text-yellow-400">
              警告: {importResult.errors.length} 条记录被跳过
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto max-h-[400px]">
        {activeTab === 'corrosion' ? (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm">
              <tr>
                <th
                  onClick={() => handleSort('nodeId')}
                  className="px-4 py-3 text-left font-medium text-slate-300 cursor-pointer hover:text-white select-none"
                >
                  <span className="flex items-center">节点号<SortIcon field="nodeId" /></span>
                </th>
                <th
                  onClick={() => handleSort('segment')}
                  className="px-4 py-3 text-left font-medium text-slate-300 cursor-pointer hover:text-white select-none"
                >
                  <span className="flex items-center">链段<SortIcon field="segment" /></span>
                </th>
                <th
                  onClick={() => handleSort('depth')}
                  className="px-4 py-3 text-right font-medium text-slate-300 cursor-pointer hover:text-white select-none"
                >
                  <span className="flex items-center justify-end">水深(米)<SortIcon field="depth" /></span>
                </th>
                <th
                  onClick={() => handleSort('avgDailyRate')}
                  className="px-4 py-3 text-right font-medium text-slate-300 cursor-pointer hover:text-white select-none"
                >
                  <span className="flex items-center justify-end">日均变化率(mV/天)<SortIcon field="avgDailyRate" /></span>
                </th>
                <th
                  onClick={() => handleSort('sampleCount')}
                  className="px-4 py-3 text-right font-medium text-slate-300 cursor-pointer hover:text-white select-none"
                >
                  <span className="flex items-center justify-end">采样次数<SortIcon field="sampleCount" /></span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">日期范围</th>
              </tr>
            </thead>
            <tbody>
              {sortedRates.map((rate, idx) => (
                <tr
                  key={rate.nodeId}
                  className={cn(
                    "border-t border-slate-700/50 transition-colors hover:bg-slate-700/30",
                    idx % 2 === 0 && "bg-slate-800/30"
                  )}
                >
                  <td className="px-4 py-3 font-mono text-cyan-300">{rate.nodeId}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs">
                      {rate.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">{rate.depth.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={cn(
                      rate.avgDailyRate < 0 ? "text-orange-400" : "text-teal-400"
                    )}>
                      {rate.avgDailyRate.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">{rate.sampleCount}</td>
                  <td className="px-4 py-3 text-right text-slate-400 text-xs">
                    {rate.dateRange[0]} ~ {rate.dateRange[1]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-300">链段</th>
                <th className="px-4 py-3 text-left font-medium text-slate-300">节点对</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">平均潮位差(cm)</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">同期采样次数</th>
              </tr>
            </thead>
            <tbody>
              {tideDiffs.map((diff, idx) => (
                <tr
                  key={`${diff.nodePair[0]}-${diff.nodePair[1]}`}
                  className={cn(
                    "border-t border-slate-700/50 transition-colors hover:bg-slate-700/30",
                    idx % 2 === 0 && "bg-slate-800/30"
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs">
                      {diff.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-300">
                    {diff.nodePair[0]} ↔ {diff.nodePair[1]}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-cyan-400">
                    {diff.avgTideDiff.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {diff.sampleCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {((activeTab === 'corrosion' && sortedRates.length === 0) ||
          (activeTab === 'tide' && tideDiffs.length === 0)) && (
          <div className="py-12 text-center text-slate-500">
            暂无数据 (筛选范围: {filter.startDate} ~ {filter.endDate})
          </div>
        )}
      </div>
    </div>
  );
}
