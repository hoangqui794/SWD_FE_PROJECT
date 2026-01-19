
import React from 'react';
import Layout from '../components/Layout';

const AlertsPage: React.FC = () => {
  const alerts = [
    { time: "2024-05-14 14:22", sensor: "Freezer Unit A2", severity: "Critical", status: "Active" },
    { time: "2024-05-14 12:05", sensor: "Dry Storage 01", severity: "Warning", status: "Resolved" },
    { time: "2024-05-13 22:15", sensor: "Medicine Cab", severity: "Critical", status: "Resolved" },
    { time: "2024-05-13 18:44", sensor: "Backroom B", severity: "Warning", status: "Resolved" },
  ];

  return (
    <Layout title="Alert History" breadcrumb="Monitoring Log">
      <h3 className="text-2xl font-bold tracking-tight mb-8">IoT Alert History Log</h3>
      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-zinc-900/50 border-b border-border-muted">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Severity</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {alerts.map((alert, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-slate-300">{alert.time}</td>
                <td className="px-6 py-4 text-xs font-medium text-white">{alert.sensor}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 border text-[10px] font-bold uppercase rounded ${
                    alert.severity === 'Critical' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-amber-500/10 border-amber-500 text-amber-500'
                  }`}>
                    {alert.severity}
                  </span>
                </td>
                <td className={`px-6 py-4 text-[10px] font-bold uppercase ${
                  alert.status === 'Active' ? 'text-red-500' : 'text-slate-500'
                }`}>
                  {alert.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AlertsPage;
