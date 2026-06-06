import { Activity, Database, Radio } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setDbStatus('online');
        else setDbStatus('offline');
      } catch {
        setDbStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-card rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
              <Radio className={cn(
                "w-2.5 h-2.5",
                dbStatus === 'online' ? "text-green-400 animate-pulse" : "text-red-400"
              )} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display tracking-tight">
              近海观测站
            </h1>
            <p className="text-sm text-slate-400">
              浮标链节腐蚀电位 · 潮位差 对比分析看板
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">数据库:</span>
            <span className={cn(
              "font-medium",
              dbStatus === 'online' ? "text-green-400" :
              dbStatus === 'checking' ? "text-yellow-400" : "text-red-400"
            )}>
              {dbStatus === 'online' ? '在线' : dbStatus === 'checking' ? '检测中' : '离线'}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">数据更新时间</div>
            <div className="text-sm font-mono text-slate-300">
              {new Date().toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
