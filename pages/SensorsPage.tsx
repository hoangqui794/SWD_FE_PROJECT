
import React, { useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const SensorsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sensors = [
    { name: "Storage Temp", type: "Temperature", value: "22.4 °C", status: "Active", color: "text-emerald-500" },
    { name: "Humid Level", type: "Humidity", value: "54%", status: "Active", color: "text-emerald-500" },
    { name: "Backroom Temp", type: "Temperature", value: "4.1 °C", status: "Offline", color: "text-red-500" },
  ];

  return (
    <Layout title="Sensors Management" breadcrumb="Environment Overview">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">IoT Sensors Management</h3>
          <p className="text-slate-500 text-sm mt-1">Inventory and real-time status of environmental sensors.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Register Sensor
        </button>
      </div>
      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-900/50 border-b border-border-muted">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {sensors.map((sensor, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-white">{sensor.name}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{sensor.type}</td>
                <td className={`px-6 py-4 font-bold ${sensor.color}`}>{sensor.value}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase ${sensor.color}`}>{sensor.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Sensor">
        <form className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor Name</label>
            <input className="w-full bg-zinc-900 border border-border-muted rounded px-4 py-2.5 text-sm text-white" placeholder="e.g. Cold Storage 01" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select className="bg-zinc-900 border border-border-muted rounded p-2.5 text-xs text-white">
              <option>Select Hub</option>
              <option>HUB-772-AX</option>
              <option>HUB-441-BV</option>
            </select>
            <select className="bg-zinc-900 border border-border-muted rounded p-2.5 text-xs text-white">
              <option>Select Type</option>
              <option>Temperature</option>
              <option>Humidity</option>
              <option>Pressure</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 px-4 py-2.5 border border-border-muted text-white rounded text-xs font-bold uppercase hover:bg-white/5"
            >
              Cancel
            </button>
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded text-xs font-bold uppercase hover:bg-primary/80"
            >
              Register
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default SensorsPage;
