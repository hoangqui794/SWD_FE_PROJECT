
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { getDashboardStats, DashboardStats } from '../services/dashboardService';

const DashboardPage: React.FC = () => {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStatsData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = [
    { label: "Total Sites", value: statsData?.total_sites.toString() || "0", icon: "store" },
    { label: "Pending Alerts", value: statsData?.pending_alerts.toString() || "0", icon: "warning", color: statsData?.pending_alerts ? "text-red-500" : "text-white" },
    { label: "Total Hubs", value: statsData?.total_hubs.toString() || "0", icon: "router", color: "text-primary" },
    { label: "Active Sensors", value: statsData?.active_sensors.toString() || "0", icon: "sensors" },
  ];

  return (
    <Layout title="Sensors Activity" breadcrumb="Environment Overview">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">System Status</h3>
          <p className="text-slate-500 text-sm mt-1">Real-time metrics from {statsData?.total_sites || 0} active locations.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-border-muted hover:bg-zinc-800 transition-colors rounded text-xs font-bold flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-sm">download</span> Export
          </button>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-4 py-2 bg-primary hover:bg-primary/80 transition-colors rounded text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 rounded-xl border border-border-muted bg-white/5 flex flex-col justify-between h-32 hover:border-primary/50 transition-all cursor-default">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <span className={`material-symbols-outlined ${stat.color || 'text-slate-600'}`}>{stat.icon}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className={`text-4xl font-bold font-display ${stat.color || 'text-white'}`}>{stat.value}</p>

            </div>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <h4 className="text-lg font-bold">Environmental Trends</h4>
          <div className="flex flex-wrap items-center gap-3 p-2 bg-white/5 rounded-lg border border-border-muted">
            <select className="bg-transparent border-none text-xs font-bold text-white focus:ring-0">
              <option>Temperature</option>
              <option>Humidity</option>
            </select>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold px-3">Last 7 Days</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-border-muted p-8 relative overflow-hidden h-72">
          <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path
              d="M0,35 Q10,32 20,36 T40,20 T60,25 T80,10 T100,15"
              fill="none"
              stroke="#1791cf"
              strokeWidth="0.5"
              className="chart-line"
            />
            <path
              d="M0,35 Q10,32 20,36 T40,20 T60,25 T80,10 T100,15 L100,40 L0,40 Z"
              fill="rgba(23, 145, 207, 0.1)"
            />
          </svg>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-bold">Priority Sensor Alerts</h4>
        <Link to="/alerts" className="text-primary text-xs font-bold hover:underline">View All History</Link>
      </div>
      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-900/50 border-b border-border-muted">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Value</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-sm">Storage Temp (Critical)</div>
                <div className="text-[10px] text-slate-500">Backroom / Medicine</div>
              </td>
              <td className="px-6 py-4 text-center font-bold text-red-500">42.8 °C</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                  <span className="text-xs font-medium text-red-500 uppercase">Critical</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right text-xs text-slate-500">Just now</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-sm">Entrance Humidity</div>
                <div className="text-[10px] text-slate-500">Main Lobby</div>
              </td>
              <td className="px-6 py-4 text-center font-bold text-amber-500">68%</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs font-medium text-amber-500 uppercase">Warning</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right text-xs text-slate-500">12 min ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default DashboardPage;
