
import React, { useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const SitesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State for sites data
  const [sites, setSites] = useState([
    { id: "S-CG-001", org: "WinMart Retail Group", name: "WinMart Cầu Giấy", hubs: "08" },
    { id: "S-HK-002", org: "WinMart Retail Group", name: "WinMart Hoàn Kiếm", hubs: "12" },
    { id: "S-BT-003", org: "WinMart Retail Group", name: "WinMart Bình Thạnh", hubs: "05" },
  ]);

  // State for form handling
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    org: "",
    name: "",
    hubs: ""
  });

  // State for delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredSites = sites.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ org: "WinMart Retail Group", name: "", hubs: "0" });
    setIsModalOpen(true);
  };

  const handleEdit = (site: any) => {
    setEditingId(site.id);
    setFormData({ org: site.org, name: site.name, hubs: site.hubs });
    setIsModalOpen(true);
  };

  const initiateDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      setSites(sites.filter(site => site.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const handleSubmit = () => {
    if (editingId) {
      // Update existing
      setSites(sites.map(site =>
        site.id === editingId
          ? { ...site, ...formData }
          : site
      ));
    } else {
      // Add new
      const newId = `S-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      setSites([...sites, { id: newId, ...formData }]);
    }
    setIsModalOpen(false);
  };

  return (
    <Layout title="Sites" breadcrumb="Administration">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">IoT Sites Management</h3>
          <p className="text-slate-500 text-sm mt-1">Manage environmental monitoring sites across the chain.</p>
        </div>
        <button onClick={handleAddNew} className="px-4 py-2 bg-white text-black hover:bg-slate-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
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
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(site)}
                    className="text-slate-500 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => initiateDelete(site.id)}
                    className="text-slate-500 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredSites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                  No sites found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Site" : "Add New Site"}>
        <form className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</label>
            <input
              value={formData.org}
              onChange={(e) => setFormData({ ...formData, org: e.target.value })}
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              placeholder="Organization Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              placeholder="e.g., WinMart Cầu Giấy"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hubs Count</label>
            <input
              type="number"
              value={formData.hubs}
              onChange={(e) => setFormData({ ...formData, hubs: e.target.value })}
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              placeholder="Number of hubs"
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
              onClick={handleSubmit}
              className="flex-1 px-6 py-2.5 bg-white text-black rounded text-xs font-bold uppercase hover:bg-slate-200"
              type="button"
            >
              {editingId ? "Save Changes" : "Add Site"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTargetId} onClose={() => setDeleteTargetId(null)} title="Confirm Deletion">
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
            </div>
            <h4 className="text-lg font-bold text-white">Delete Site?</h4>
            <p className="text-slate-400 text-sm">
              Are you sure you want to delete this site? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteTargetId(null)}
              className="flex-1 px-6 py-2.5 border border-border-muted text-slate-400 rounded text-xs font-bold uppercase hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-6 py-2.5 bg-red-500 text-white rounded text-xs font-bold uppercase hover:bg-red-600 shadow-lg shadow-red-500/20"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default SitesPage;
