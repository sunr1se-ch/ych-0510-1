import { Activity, Droplets, TrendingDown, Waves } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { cn } from '../lib/utils.js';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}

function StatCard({ title, value, unit, icon, color, delay }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white font-display">{value}</span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          color
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsOverview() {
  const { stats, loading } = useDashboardStore();

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-slate-700/50 rounded w-24 mb-3" />
            <div className="h-8 bg-slate-700/50 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="监测节点"
        value={stats?.nodeCount || 0}
        unit="个"
        icon={<Activity className="w-5 h-5 text-cyan-400" />}
        color="bg-cyan-500/20"
        delay={100}
      />
      <StatCard
        title="采样次数"
        value={stats?.sampleCount || 0}
        unit="次"
        icon={<Droplets className="w-5 h-5 text-blue-400" />}
        color="bg-blue-500/20"
        delay={200}
      />
      <StatCard
        title="平均腐蚀速率"
        value={stats?.avgCorrosionRate?.toFixed(3) || '0.000'}
        unit="mV/天"
        icon={<TrendingDown className="w-5 h-5 text-orange-400" />}
        color="bg-orange-500/20"
        delay={300}
      />
      <StatCard
        title="最大潮位差"
        value={stats?.maxTideDiff?.toFixed(1) || '0.0'}
        unit="cm"
        icon={<Waves className="w-5 h-5 text-teal-400" />}
        color="bg-teal-500/20"
        delay={400}
      />
    </div>
  );
}
