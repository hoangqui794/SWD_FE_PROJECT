
import React, { useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const SitesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const sites = [
    { id: "S-CG-001", org: "WinMart Retail Group", name: "WinMart Cầu Giấy", hubs: "08" },
    { id: "S-HK-002", org: "WinMart Retail Group", name: "WinMart Hoàn Kiếm", hubs: "12" },
    { id: "S-BT-003", org: "WinMart Retail Group", name: "WinMart Bình Thạnh", hubs: "05" },
  ];

  const filteredSites = sites.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Layout title="Sites" breadcrumb="Administration">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">IoT Sites Management</h3>
          <p className="text-slate-500 text-sm mt-1">Manage environmental monitoring sites across the chain.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-white text-black hover:bg-slate-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Add New Site
        </button>
      </div>
      
      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        <div className="p-4 border-b border-border-muted flex gap-4 items-center justify-between bg-zinc-900/30">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background-dark border-border-muted text-xs rounded pl-10 focus:ring-1 focus:ring-primary h-9" 
              placeholder="Search sites..." 
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="border-b border-border-muted bg-zinc-900/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Hubs</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {filteredSites.map(site => (
              <tr key={site.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-white">{site.id}</td>
                <td className="px-6 py-4 text-xs">{site.org}</td>
                <td className="px-6 py-4 text-sm font-medium">{site.name}</td>
                <td className="px-6 py-4 text-center font-bold">{site.hubs}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Site">
        <form className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site Name</label>
            <input 
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white" 
              placeholder="e.g., WinMart Cầu Giấy" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
            <input 
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white" 
              placeholder="Full street address" 
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 px-6 py-2.5 border border-border-muted text-slate-400 rounded text-xs font-bold uppercase hover:bg-white/5" 
              type="button"
            >
              Cancel
            </button>
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 px-6 py-2.5 bg-white text-black rounded text-xs font-bold uppercase hover:bg-slate-200" 
              type="button"
            >
              Add Site
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default SitesPage;
