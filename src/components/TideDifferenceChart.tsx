import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import type { EChartsOption } from 'echarts';

export function TideDifferenceChart() {
  const { tideDiffs, loading } = useDashboardStore();

  const option = useMemo((): EChartsOption => {
    const pairLabels = tideDiffs.map(d => `${d.nodePair[0]}↔${d.nodePair[1]}`);
    const values = tideDiffs.map(d => d.avgTideDiff);
    const sampleCounts = tideDiffs.map(d => d.sampleCount);

    const colorMap: Record<string, string> = {
      A: '#06b6d4',
      B: '#3b82f6',
      C: '#8b5cf6',
    };

    const colors = tideDiffs.map(d => colorMap[d.segment] || '#64748b');

    return {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '12%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(100, 116, 139, 0.5)',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: any) => {
          const data = tideDiffs[params.dataIndex];
          return `
            <div style="padding: 4px 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div>链段: ${data.segment}</div>
              <div>平均潮位差: <span style="color: #38bdf8">${data.avgTideDiff.toFixed(1)} cm</span></div>
              <div>同期采样: ${data.sampleCount} 次</div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: pairLabels,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          rotate: 30,
          interval: 0,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'cm',
        nameTextStyle: { color: '#94a3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
      },
      series: [{
        type: 'scatter',
        data: values.map((value, idx) => ({
          value: [idx, value, sampleCounts[idx]],
          symbolSize: Math.max(12, sampleCounts[idx] * 1.5),
          itemStyle: {
            color: {
              type: 'radial',
              x: 0.5, y: 0.5, r: 0.5,
              colorStops: [
                { offset: 0, color: colors[idx] },
                { offset: 1, color: colors[idx] + '80' },
              ],
            },
            shadowColor: colors[idx],
            shadowBlur: 15,
            borderColor: '#ffffff40',
            borderWidth: 2,
          },
        })),
        animationDuration: 800,
        animationEasing: 'elasticOut',
      }],
    };
  }, [tideDiffs]);

  return (
    <div className="glass-card rounded-xl p-5 h-full">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full" />
        相邻节点潮位差
      </h3>
      <div className="h-[320px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : tideDiffs.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            暂无数据
          </div>
        ) : (
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        )}
      </div>
    </div>
  );
}
