import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import type { EChartsOption } from 'echarts';

export function CorrosionRateChart() {
  const { corrosionRates, loading } = useDashboardStore();

  const option = useMemo((): EChartsOption => {
    const nodeIds = corrosionRates.map(r => r.nodeId);
    const rates = corrosionRates.map(r => r.avgDailyRate);
    const segments = corrosionRates.map(r => r.segment);

    const colorMap: Record<string, string> = {
      A: '#06b6d4',
      B: '#3b82f6',
      C: '#8b5cf6',
    };

    const colors = segments.map(s => colorMap[s] || '#64748b');

    return {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '12%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(100, 116, 139, 0.5)',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: any) => {
          const data = params[0];
          const rate = corrosionRates[data.dataIndex];
          return `
            <div style="padding: 4px 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
              <div>链段: ${rate.segment}</div>
              <div>日均变化率: <span style="color: ${data.value < 0 ? '#fb923c' : '#2dd4bf'}">${data.value.toFixed(3)} mV/天</span></div>
              <div>采样次数: ${rate.sampleCount}</div>
              <div>日期范围: ${rate.dateRange[0]} ~ ${rate.dateRange[1]}</div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: nodeIds,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 11, rotate: 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'mV/天',
        nameTextStyle: { color: '#94a3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
      },
      series: [{
        type: 'bar',
        data: rates.map((value, idx) => ({
          value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: value < 0 ? '#fb923c' : '#2dd4bf' },
                { offset: 1, color: value < 0 ? '#ea580c' : '#0d9488' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
            shadowColor: colors[idx],
            shadowBlur: 10,
          },
        })),
        barWidth: '50%',
        animationDuration: 800,
        animationEasing: 'cubicOut',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#ef4444', type: 'dashed', width: 1 },
          data: [{ yAxis: 0 }],
        },
      }],
    };
  }, [corrosionRates]);

  return (
    <div className="glass-card rounded-xl p-5 h-full">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
        腐蚀电位日均变化率
      </h3>
      <div className="h-[320px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : corrosionRates.length === 0 ? (
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
