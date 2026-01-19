
import React, { useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const HubsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hubs = [
    { id: "HUB-772-AX", mac: "00:1A:2B:3C:4D:5E", status: "Offline", color: "text-red-500" },
    { id: "HUB-441-BV", mac: "11:22:33:44:55:66", status: "Online", color: "text-emerald-500" },
    { id: "HUB-902-CZ", mac: "AA:BB:CC:DD:EE:FF", status: "Online", color: "text-emerald-500" },
  ];

  return (
    <Layout title="Hubs" breadcrumb="Administration">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Hubs Management</h3>
          <p className="text-slate-500 text-sm mt-1">Configure and monitor gateway devices across all store locations.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-white text-black hover:bg-slate-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Add New Hub
        </button>
      </div>
      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border-muted bg-zinc-900/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">MAC Address</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {hubs.map((hub, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-white">{hub.id}</td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">{hub.mac}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase ${hub.color}`}>{hub.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Hub">
        <form className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MAC Address</label>
            <input 
              className="w-full bg-zinc-900 border border-border-muted rounded px-4 py-2.5 text-sm font-mono focus:ring-1 focus:ring-primary outline-none text-white" 
              placeholder="00:00:00:00:00:00" 
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 px-4 py-2.5 border border-border-muted text-white rounded text-xs font-bold uppercase hover:bg-white/5"
            >
              Cancel
            </button>
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 px-4 py-2.5 bg-white text-black rounded text-xs font-bold uppercase hover:bg-slate-200"
            >
              Register Hub
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default HubsPage;
