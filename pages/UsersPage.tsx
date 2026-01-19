
import React, { useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const UsersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const users = [
    { name: "Alexander Pierce", email: "a.pierce@system.io", role: "Admin" },
    { name: "Sarah Jenkins", email: "s.jenkins@system.io", role: "Site Manager" },
    { name: "David Chen", email: "d.chen@system.io", role: "Maintenance" },
  ];

  return (
    <Layout title="Users" breadcrumb="Administration">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">IoT Users Administration</h3>
          <p className="text-slate-500 text-sm mt-1">Manage system access for organizations and site staff.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-white text-black hover:bg-slate-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">person_add</span> Create User
        </button>
      </div>
      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-900/50 border-b border-border-muted">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {users.map((user, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-white">{user.name}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold uppercase bg-white/10 px-2 py-1 rounded text-white">
                    {user.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create User">
        <form className="p-8 grid grid-cols-1 gap-6 bg-white text-black">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
            <input className="w-full border-slate-200 p-3 text-sm focus:ring-0 focus:border-black" placeholder="e.g. Robert Smith" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</label>
            <input type="email" className="w-full border-slate-200 p-3 text-sm focus:ring-0 focus:border-black" placeholder="r.smith@example.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</label>
            <select className="w-full border-slate-200 p-3 text-sm focus:ring-0 focus:border-black">
              <option>Admin</option>
              <option>Site Manager</option>
              <option>Technician</option>
              <option>Viewer</option>
            </select>
          </div>
          <div className="flex gap-3 pt-6 justify-end">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="px-6 py-3 border border-black text-black text-xs font-bold uppercase hover:bg-slate-50 transition-colors" 
              type="button"
            >
              Cancel
            </button>
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="px-6 py-3 bg-black text-white text-xs font-bold uppercase hover:bg-slate-800 transition-colors" 
              type="button"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default UsersPage;
