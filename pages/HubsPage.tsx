import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

import { hubService, Hub } from '../services/hubService';
import { siteService, Site } from '../services/siteService';
import { signalRService } from '../services/signalrService';

const HubsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);


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
      console.log("Realtime update received via [ReceiveHubStatus]:", data);
      fetchHubs(false); // Silent update
    };

    const handleSensorUpdate = (data: any) => {
      console.log("Realtime update received via [ReceiveSensorUpdate]:", data);
      // We might want to refresh hubs if sensor counts change, or update specific rows
      fetchHubs(false); // Silent update
    };

    signalRService.on("ReceiveHubStatus", handleHubStatus);
    signalRService.on("ReceiveSensorUpdate", handleSensorUpdate);

    return () => {
      signalRService.off("ReceiveHubStatus", handleHubStatus);
      signalRService.off("ReceiveSensorUpdate", handleSensorUpdate);
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
    } catch (error: any) {
      console.error("Failed to save hub", error);
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
      } catch (error: any) {
        console.error("Failed to delete hub", error);
        // If 404, it's already gone, so update UI to reflect that
        if (error.response && error.response.status === 404) {
          setHubs(hubs.filter(hub => hub.hubId !== deleteTargetId));
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
          <h3 className="text-2xl font-bold tracking-tight">Hubs Management</h3>
          <p className="text-slate-500 text-sm mt-1">Configure and monitor gateway devices across all store locations.</p>
        </div>
        {canManage && (
          <button onClick={handleAddNew} className="px-4 py-2 bg-white text-black hover:bg-slate-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Add New Hub
          </button>
        )}
      </div>
      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {/* ... header ... */}
            <thead className="border-b border-border-muted bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">MAC Address</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                {canManage && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading hubs...</td></tr>
              ) : hubs.map((hub) => (
                <tr key={hub.hubId} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-white">{hub.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{hub.siteName}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">{hub.macAddress}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase ${hub.isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                      {hub.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(hub)}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        onClick={() => initiateDelete(hub.hubId)}
                        className="text-slate-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined">delete</span>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site</label>
            <select
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: Number(e.target.value) })}
              className="w-full bg-zinc-900 border border-border-muted rounded px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
            >
              <option value={0}>Select a Site</option>
              {sites.map(site => (
                <option key={site.siteId} value={site.siteId}>{site.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-border-muted rounded px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              placeholder="e.g. Gateway 01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MAC Address</label>
            <input
              value={formData.macAddress}
              onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
              className={`w-full bg-zinc-900 border border-border-muted rounded px-4 py-2.5 text-sm font-mono focus:ring-1 focus:ring-primary outline-none text-white`}
              placeholder="00:00:00:00:00:00"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-border-muted text-white rounded text-xs font-bold uppercase hover:bg-white/5"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={formData.siteId === 0 || !formData.name || (!editingId && !formData.macAddress)}
              className={`flex-1 px-4 py-2.5 bg-white text-black rounded text-xs font-bold uppercase transition-colors ${formData.siteId === 0 || !formData.name || (!editingId && !formData.macAddress) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
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
            <h4 className="text-lg font-bold text-white">Delete Hub?</h4>
            <p className="text-slate-400 text-sm">
              Are you sure you want to delete this hub? This action cannot be undone.
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
    </Layout >
  );
};

export default HubsPage;
