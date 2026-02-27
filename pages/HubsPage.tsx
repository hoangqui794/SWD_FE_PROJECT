import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

import { hubService, Hub } from '../services/hubService';
import { siteService, Site } from '../services/siteService';
import { signalRService } from '../services/signalrService';

const HubsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showNotification } = useNotification();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');


  // Form State
  const [formData, setFormData] = useState({
    siteId: 0,
    name: "",
    macAddress: ""
  });

  useEffect(() => {
    fetchHubs();
    fetchSites();

    // Ensure connection is started

    signalRService.startConnection();

    // Listen for realtime updates using the correct event names provided by the user
    const handleHubStatus = (data: any) => {
      console.log("Realtime update received via [ReceiveHubStatusChange]:", data);
      fetchHubs(false); // Silent update
    };

    const handleSensorUpdate = (data: any) => {
      console.log("Realtime update received via [ReceiveSensorStatusChange]:", data);
      fetchHubs(false); // Silent update
    };

    signalRService.on("ReceiveHubStatusChange", handleHubStatus);
    signalRService.on("ReceiveSensorStatusChange", handleSensorUpdate);

    return () => {
      signalRService.off("ReceiveHubStatusChange", handleHubStatus);
      signalRService.off("ReceiveSensorStatusChange", handleSensorUpdate);
    };
  }, []);

  const fetchHubs = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await hubService.getAll();
      setHubs(data);
    } catch (error) {
      console.error("Failed to fetch hubs", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const data = await siteService.getAll();
      setSites(data);
    } catch (error) {
      console.error("Failed to fetch sites", error);
    }
  };

  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ siteId: 0, name: "", macAddress: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (hub: Hub) => {
    setEditingId(hub.hubId);
    setFormData({
      siteId: hub.siteId,
      name: hub.name,
      macAddress: hub.macAddress
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (formData.siteId === 0) return;

      if (editingId) {
        await hubService.update(editingId, {
          siteId: formData.siteId,
          name: formData.name,
          macAddress: formData.macAddress
        });
      } else {
        await hubService.create(formData);
      }

      setIsModalOpen(false);
      setFormData({ siteId: 0, name: "", macAddress: "" });
      fetchHubs(); // Refresh list
      showNotification(editingId ? "Hub updated successfully!" : "Hub created successfully!", 'success');
    } catch (error: any) {
      console.error("Failed to save hub", error);
      showNotification("Failed to save hub: " + (error.response?.data?.message || error.message), 'error');
    }
  };

  // State for delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const initiateDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await hubService.delete(deleteTargetId);
        // Remove locally
        setHubs(hubs.filter(hub => hub.hubId !== deleteTargetId));
        showNotification("Hub deleted successfully!", 'success');
      } catch (error: any) {
        console.error("Failed to delete hub", error);
        // If 404, it's already gone, so update UI to reflect that
        if (error.response && error.response.status === 404) {
          setHubs(hubs.filter(hub => hub.hubId !== deleteTargetId));
          showNotification("Hub was already deleted.", 'warning');
        } else {
          showNotification("Failed to delete hub: " + (error.response?.data?.message || error.message), 'error');
        }
      } finally {
        setDeleteTargetId(null);
      }
    }
  };

  return (
    <Layout title="Hubs" breadcrumb="Administration">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Hubs Management</h3>
          <p className="text-slate-500 text-sm mt-1">Configure and monitor gateway devices across all store locations.</p>
        </div>
        {canManage && (
          <button onClick={handleAddNew} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-slate-200 transition-all rounded shadow-lg shadow-slate-900/10 dark:shadow-none text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Add New Hub
          </button>
        )}
      </div>
      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-border-muted overflow-hidden transition-colors shadow-sm">
        {/* Filter/Search Section */}
        <div className="p-4 border-b border-slate-200 dark:border-border-muted bg-slate-50 dark:bg-zinc-900/30">
          <div className="relative max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Search hubs by name, site, or MAC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {/* ... header ... */}
            <thead className="border-b border-slate-200 dark:border-border-muted bg-slate-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Hub Name</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Site Name</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">MAC Address</th>
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Status</th>
                {canManage && <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-muted">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading hubs...</td></tr>
              ) : hubs.filter(hub =>
                hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hub.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hub.macAddress.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No hubs found matching your search.</td></tr>
              ) : hubs.filter(hub =>
                hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hub.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hub.macAddress.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((hub) => (
                <tr key={hub.hubId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{hub.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{hub.siteName}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">{hub.macAddress}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase ${hub.isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                      {hub.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(hub)}
                        className="text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => initiateDelete(hub.hubId)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Hub" : "Add New Hub"}>
        <form className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Site</label>
            <select
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white appearance-none transition-colors"
            >
              <option value={0}>Select a Site</option>
              {sites.map(site => (
                <option key={site.siteId} value={site.siteId} className="bg-white text-slate-900">{site.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hub Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
              placeholder="e.g. Gateway 01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">MAC Address</label>
            <input
              value={formData.macAddress}
              onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
              className={`w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors`}
              placeholder="00:00:00:00:00:00"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={formData.siteId === 0 || !formData.name || (!editingId && !formData.macAddress)}
              className={`flex-1 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold uppercase transition-all shadow-lg shadow-slate-900/10 dark:shadow-none ${formData.siteId === 0 || !formData.name || (!editingId && !formData.macAddress) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black dark:hover:bg-slate-200'}`}
              type="button"
            >
              {editingId ? "Save Changes" : "Register Hub"}
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
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Delete Hub?</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Are you sure you want to delete this hub? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteTargetId(null)}
              className="flex-1 px-6 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-6 py-2.5 bg-red-500 text-white rounded-lg text-xs font-bold uppercase hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </Layout >
  );
};

export default HubsPage;
