import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import type { EChartsOption } from 'echarts';

export function NodeLayoutChart() {
  const { nodes, filter } = useDashboardStore();
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const option = useMemo((): EChartsOption => {
    const visibleNodes = filter.segments.length > 0
      ? nodes.filter(n => filter.segments.includes(n.segment))
      : nodes;

    const bySegment: Record<string, typeof visibleNodes> = {};
    visibleNodes.forEach(node => {
      if (!bySegment[node.segment]) bySegment[node.segment] = [];
      bySegment[node.segment].push(node);
    });

    const segments = Object.keys(bySegment).sort();
    const maxDepth = Math.max(...visibleNodes.map(n => n.depth), 30);

    const series: any[] = [];
    const yAxisData = segments.map(s => `链段 ${s}`);

    segments.forEach((segment, segIdx) => {
      const segNodes = bySegment[segment].sort((a, b) => a.positionInSegment - b.positionInSegment);

      const linkData = segNodes.slice(0, -1).map((_, i) => ({
        source: `${segment}-${i}`,
        target: `${segment}-${i + 1}`,
        lineStyle: { color: '#475569', width: 3 },
      }));

      const nodeData = segNodes.map((node, idx) => ({
        name: `${segment}-${idx}`,
        value: node.depth,
        nodeData: node,
      }));

      series.push({
        type: 'graph',
        layout: 'none',
        coordinateSystem: 'cartesian2d',
        data: nodeData.map((d, idx) => ({
          ...d,
          x: (idx + 1) * 100 / (segNodes.length + 1),
          y: segIdx + 0.5,
          symbolSize: 30 + d.value / maxDepth * 30,
          itemStyle: {
            color: hoverNode === d.nodeData.nodeId
              ? '#fb923c'
              : {
                type: 'radial',
                x: 0.4, y: 0.3, r: 0.8,
                colorStops: [
                  { offset: 0, color: '#67e8f9' },
                  { offset: 1, color: '#0891b2' },
                ],
              },
            shadowColor: '#06b6d4',
            shadowBlur: hoverNode === d.nodeData.nodeId ? 25 : 10,
          },
          label: {
            show: true,
            formatter: d.nodeData.nodeId,
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
          },
        })),
        links: linkData,
        lineStyle: { color: '#475569', width: 2 },
        edgeSymbol: ['none', 'none'],
      });
    });

    return {
      backgroundColor: 'transparent',
      grid: {
        left: '15%',
        right: '5%',
        bottom: '10%',
        top: '12%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(100, 116, 139, 0.5)',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: any) => {
          if (params.dataType === 'node' && params.data.nodeData) {
            const node = params.data.nodeData;
            return `
              <div style="padding: 4px 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${node.nodeId}</div>
                <div>链段: ${node.segment}</div>
                <div>布设水深: <span style="color: #22d3ee">${node.depth} 米</span></div>
                <div>链段位置: 第 ${node.positionInSegment} 个</div>
              </div>
            `;
          }
          return '';
        },
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 100,
        show: false,
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 500 },
        axisTick: { show: false },
      },
      series,
    };
  }, [nodes, filter.segments, hoverNode]);

  const chartEvents = useMemo(() => ({
    mouseover: (params: any) => {
      if (params.dataType === 'node' && params.data.nodeData) {
        setHoverNode(params.data.nodeData.nodeId);
      }
    },
    mouseout: () => setHoverNode(null),
  }), []);

  return (
    <div className="glass-card rounded-xl p-5 h-full">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-full" />
        节点布设示意
      </h3>
      <div className="h-[320px]">
        {nodes.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            暂无节点数据
          </div>
        ) : (
          <ReactECharts
            option={option}
            onEvents={chartEvents}
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-600" />
          <span>节点大小表示布设水深</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-slate-500" />
          <span>相邻节点连接</span>
        </div>
      </div>
    </div>
  );
}
