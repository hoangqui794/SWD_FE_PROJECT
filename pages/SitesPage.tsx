import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';




import { siteService, Site } from '../services/siteService';

const SitesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showNotification } = useNotification();
  const isAdmin = hasRole(['ADMIN']);
  const canEdit = hasRole(['ADMIN', 'MANAGER']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sites
  useEffect(() => {
    fetchSites();
  }, [searchTerm]);

  const fetchSites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await siteService.getAll(searchTerm);
      setSites(data);
    } catch (error) {
      console.error("Failed to fetch sites", error);
      setError('Connection error. Please check your backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  // State for form handling
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    org: "",
    name: "",
    address: "",
    geoLocation: "",
    hubs: ""
  });

  // State for delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ org: "WinMart Retail Group", name: "", address: "", geoLocation: "", hubs: "0" });
    setIsModalOpen(true);
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.siteId);
    setFormData({
      org: site.orgName,
      name: site.name,
      address: site.address,
      geoLocation: site.geoLocation,
      hubs: site.hubCount.toString()
    });
    setIsModalOpen(true);
  };

  const initiateDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await siteService.delete(deleteTargetId);
        // Remove locally
        setSites(sites.filter(site => site.siteId !== deleteTargetId));
        showNotification('Site deleted successfully!', 'success');
      } catch (e: any) {
        console.error("Failed to delete site", e);
        // If 404, it's already gone, so update UI to reflect that
        if (e.response && e.response.status === 404) {
          setSites(sites.filter(site => site.siteId !== deleteTargetId));
          showNotification('Site was already deleted.', 'warning');
        } else {
          showNotification('Failed to delete site: ' + (e.response?.data?.message || e.message), 'error');
        }
      } finally {
        setDeleteTargetId(null);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await siteService.update(editingId, {
          orgId: 1, // Defaulting to 1 as per current logic
          name: formData.name,
          address: formData.address,
          geoLocation: formData.geoLocation || "0,0"
        });
      } else {
        await siteService.create({
          orgId: 1, // Default for "WinMart Retail Group"
          name: formData.name,
          address: formData.address,
          geoLocation: formData.geoLocation || "0,0"
        });
      }
      // Refresh sites list
      fetchSites();
      setIsModalOpen(false);
      showNotification(editingId ? "Site updated successfully!" : "Site created successfully!", 'success');
    } catch (e: any) {
      console.error("Failed to save site", e);
      const errorMsg = e.response?.data?.message || e.message || "Unknown error";
      showNotification(`Failed to save site: ${errorMsg}`, 'error');
    }
  };

  return (
    <Layout title="Sites" breadcrumb="Administration">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">IoT Sites Management</h3>
          <p className="text-slate-500 text-sm mt-1">Manage environmental monitoring sites across the chain.</p>
        </div>
        {isAdmin && (
          <button onClick={handleAddNew} className="px-4 py-2 bg-white text-black hover:bg-slate-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Add New Site
          </button>
        )}
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

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading sites...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg m-4 border border-red-500/20">
            <p className="font-bold">Error loading data</p>
            <p className="text-sm opacity-80 mt-1">{error}</p>
            <button onClick={fetchSites} className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="border-b border-border-muted bg-zinc-900/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Hubs</th>
                  {canEdit && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {sites.map(site => (
                  <tr key={site.siteId} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white whitespace-nowrap">{site.siteId}</td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">{site.orgName}</td>
                    <td className="px-6 py-4 text-sm font-medium min-w-[200px]">
                      {site.name}
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">{site.address}</div>
                      <div className="text-[9px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">location_on</span>
                        {site.geoLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{site.hubCount}</td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(site)}
                          className="text-slate-500 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => initiateDelete(site.siteId)}
                            className="text-slate-500 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {sites.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No sites found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
            <input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              placeholder="e.g., 123 Cau Giay, Hanoi"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geo Location</label>
            <input
              value={formData.geoLocation}
              onChange={(e) => setFormData({ ...formData, geoLocation: e.target.value })}
              className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
              placeholder="Lat, Long (e.g. 21.0285,105.8542)"
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
    </Layout >
  );
};

export default SitesPage;
