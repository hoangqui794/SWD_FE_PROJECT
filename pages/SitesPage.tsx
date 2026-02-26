import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';




import { siteService, Site } from '../services/siteService';
import { organizationService, Organization } from '../services/organizationService';

const SitesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showNotification } = useNotification();
  const isAdmin = hasRole(['ADMIN']);
  const canEdit = hasRole(['ADMIN', 'MANAGER']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sites and organizations
  useEffect(() => {
    fetchSites();
    fetchOrganizations();
  }, [searchTerm]);

  const fetchOrganizations = async () => {
    try {
      const data = await organizationService.getAll();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to fetch organizations", error);
    }
  };

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
    orgId: 0,
    name: "",
    address: "",
    geoLocation: "",
    hubs: ""
  });

  // State for delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleAddNew = () => {
    setEditingId(null);
    // Default to first org if available, else 0
    const defaultOrgId = organizations.length > 0 ? organizations[0].orgId : 0;
    setFormData({ orgId: defaultOrgId, name: "", address: "", geoLocation: "", hubs: "0" });
    setIsModalOpen(true);
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.siteId);

    // Attempt to find orgId if missing (backend list might not return it)
    let currentOrgId = site.orgId;
    if (!currentOrgId && site.orgName) {
      const foundOrg = organizations.find(o => o.name === site.orgName);
      if (foundOrg) currentOrgId = foundOrg.orgId;
    }

    setFormData({
      orgId: currentOrgId || 0,
      name: site.name,
      address: site.address,
      geoLocation: site.geoLocation,
      hubs: site.hubCount ? site.hubCount.toString() : "0"
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
    // Attempt to auto-correct orgId using cached organizations if formData.orgId is invalid (0) but we have a single org
    let submitOrgId = formData.orgId;
    if (submitOrgId === 0 && organizations.length > 0) {
      // Fallback: If only 1 org, use it.
      if (organizations.length === 1) submitOrgId = organizations[0].orgId;
    }

    if (submitOrgId === 0) {
      showNotification("Please select an organization", "warning");
      return;
    }

    try {
      if (editingId) {
        await siteService.update(editingId, {
          orgId: submitOrgId,
          name: formData.name,
          address: formData.address,
          geoLocation: formData.geoLocation || "0,0"
        });
      } else {
        await siteService.create({
          orgId: submitOrgId,
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
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">IoT Sites Management</h3>
          <p className="text-slate-500 text-sm mt-1">Manage environmental monitoring sites across the chain.</p>
        </div>
        {isAdmin && (
          <button onClick={handleAddNew} className="px-4 py-2 bg-slate-900 border border-slate-900 dark:bg-white dark:border-white text-white dark:text-black hover:bg-black dark:hover:bg-slate-200 transition-all rounded shadow-lg shadow-slate-900/10 dark:shadow-none text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Add New Site
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-border-muted overflow-hidden transition-colors shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-border-muted flex gap-4 items-center justify-between bg-slate-50 dark:bg-zinc-900/30">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-border-muted text-xs rounded pl-10 focus:ring-1 focus:ring-primary h-9 text-slate-900 dark:text-white transition-colors"
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
              <thead className="border-b border-slate-200 dark:border-border-muted bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Site ID</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Organization</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Site Name</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-center">Hubs</th>
                  {canEdit && <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-muted">
                {sites.map(site => (
                  <tr key={site.siteId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">{site.siteId}</td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap text-slate-700 dark:text-slate-300">{site.orgName}</td>
                    <td className="px-6 py-4 text-sm font-medium min-w-[200px] text-slate-900 dark:text-white">
                      {site.name}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">{site.address}</div>
                      <div className="text-[9px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">location_on</span>
                        {site.geoLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">{site.hubCount}</td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(site)}
                          className="text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => initiateDelete(site.siteId)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
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
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Organization</label>
            <select
              value={formData.orgId}
              onChange={(e) => setFormData({ ...formData, orgId: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white appearance-none transition-colors"
            >
              <option value={0} disabled>Select Organization</option>
              {organizations.map(org => (
                <option key={org.orgId} value={org.orgId} className="text-slate-900 bg-white">{org.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Site Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
              placeholder="e.g., WinMart Cầu Giấy"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Address</label>
            <input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
              placeholder="e.g., 123 Cau Giay, Hanoi"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Geo Location</label>
            <input
              value={formData.geoLocation}
              onChange={(e) => setFormData({ ...formData, geoLocation: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
              placeholder="Lat, Long (e.g. 21.0285,105.8542)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400 rounded text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded text-xs font-bold uppercase hover:bg-black dark:hover:bg-slate-200 shadow-lg shadow-slate-900/10 dark:shadow-none transition-all"
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
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Delete Site?</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Are you sure you want to delete this site? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteTargetId(null)}
              className="flex-1 px-6 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400 rounded text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-6 py-2.5 bg-red-500 text-white rounded text-xs font-bold uppercase hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
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
