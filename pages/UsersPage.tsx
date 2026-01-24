import React, { useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { Role } from '../types/auth';

const UsersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([
    { id: 1, name: "Alexander Pierce", email: "a.pierce@system.io", role: "ADMIN" as Role },
    { id: 2, name: "Sarah Jenkins", email: "s.jenkins@system.io", role: "MANAGER" as Role },
    { id: 3, name: "David Chen", email: "d.chen@system.io", role: "USER" as Role },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "USER" as Role
  });

  const handleCreateUser = () => {
    // Mock user creation
    setUsers([...users, { id: users.length + 1, ...formData }]);
    setIsModalOpen(false);
    setFormData({ name: "", email: "", role: "USER" });
  };

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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/50 border-b border-border-muted">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{user.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase bg-white/10 px-2 py-1 rounded text-white`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create User">
        <form className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
            <input
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              placeholder="e.g. Robert Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
            <input
              type="email"
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              placeholder="r.smith@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
            <select
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="USER">User</option>
            </select>
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
              onClick={handleCreateUser}
              className="flex-1 px-6 py-2.5 bg-white text-black rounded text-xs font-bold uppercase hover:bg-slate-200"
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
