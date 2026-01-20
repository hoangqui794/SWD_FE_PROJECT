import React, { useState } from 'react';
import Layout from '../components/Layout';

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState([
    { id: 1, time: "2024-05-14 14:22", sensor: "Freezer Unit A2", severity: "Critical", status: "Active" },
    { id: 2, time: "2024-05-14 12:05", sensor: "Dry Storage 01", severity: "Warning", status: "Resolved" },
    { id: 3, time: "2024-05-13 22:15", sensor: "Medicine Cab", severity: "Critical", status: "Resolved" },
    { id: 4, time: "2024-05-13 18:44", sensor: "Backroom B", severity: "Warning", status: "Resolved" },
    { id: 5, time: "2024-05-12 09:30", sensor: "Main Server Room", severity: "Critical", status: "Active" },
  ]);

  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Resolved'>('All');
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.sensor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || alert.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleResolve = (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this alert log?')) {
      setAlerts(alerts.filter(a => a.id !== id));
    }
  };

  const getSeverityStyle = (severity: string) => {
    return severity === 'Critical'
      ? 'bg-red-500/10 border-red-500 text-red-500'
      : 'bg-amber-500/10 border-amber-500 text-amber-500';
  };

  return (
    <Layout title="Alert History" breadcrumb="Monitoring Log">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">IoT Alert History Log</h3>
          <p className="text-slate-500 text-sm mt-1">Real-time monitoring anomalies and system warnings.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${filterStatus === status
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        <div className="p-4 border-b border-border-muted flex gap-4 items-center justify-between bg-zinc-900/30">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background-dark border-border-muted text-xs rounded pl-10 focus:ring-1 focus:ring-primary h-9"
              placeholder="Search by sensor..."
            />
          </div>
          <div className="text-xs font-mono text-slate-500">
            Showing {filteredAlerts.length} record(s)
          </div>
        </div>

        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-zinc-900/50 border-b border-border-muted">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Severity</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {filteredAlerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-slate-300">{alert.time}</td>
                <td className="px-6 py-4 text-xs font-medium text-white">{alert.sensor}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 border text-[10px] font-bold uppercase rounded ${getSeverityStyle(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-2 text-[10px] font-bold uppercase ${alert.status === 'Active' ? 'text-red-500 animate-pulse' : 'text-slate-500'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${alert.status === 'Active' ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                    {alert.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {alert.status === 'Active' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/50 rounded hover:bg-green-500/20 text-[10px] font-bold uppercase transition-colors"
                        title="Mark as Resolved"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                      title="Delete Log"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAlerts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-20">notifications_off</span>
                  No alerts found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AlertsPage;
