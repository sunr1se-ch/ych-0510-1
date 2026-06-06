import { useEffect } from 'react';
import { Header } from '../components/Header.js';
import { FilterBar } from '../components/FilterBar.js';
import { StatsOverview } from '../components/StatsCard.js';
import { CorrosionRateChart } from '../components/CorrosionRateChart.js';
import { TideDifferenceChart } from '../components/TideDifferenceChart.js';
import { NodeLayoutChart } from '../components/NodeLayoutChart.js';
import { DataTable } from '../components/DataTable.js';
import { useDashboardStore } from '../store/useDashboardStore.js';

export default function Home() {
  const { fetchAllData, error } = useDashboardStore();

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto">
        <Header />
        <FilterBar />

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
            错误: {error}
          </div>
        )}

        <StatsOverview />

        <div className="mb-6">
          <CorrosionRateChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TideDifferenceChart />
          <NodeLayoutChart />
        </div>

        <DataTable />

        <footer className="mt-8 text-center text-sm text-slate-500 pb-4">
          <p>近海观测站浮标监测系统 v1.0 | 数据更新周期: 每3天自动采样</p>
        </footer>
      </div>
    </div>
  );
}