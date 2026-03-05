import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [sites, setSites] = useState<Site[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrgId, setFilterOrgId] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'siteId' | 'name' | 'address' | 'orgId'>('siteId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    orgId: 0,
    name: '',
    address: '',
    geoLocation: '',
  });

  // Delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const fetchSites = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await siteService.getAll({
        search: searchTerm || undefined,
        orgId: filterOrgId,
        sortBy,
        sortOrder,
      });
      setSites(data);
    } catch (error) {
      console.error('Failed to fetch sites', error);
      setError('Connection error. Please check your backend server.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [searchTerm, filterOrgId, sortBy, sortOrder]);

  // Mount: fetch organizations
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Re-fetch khi filter/sort thay đổi (debounce search)
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchSites();
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [fetchSites]);

  const fetchOrganizations = async () => {
    try {
      const data = await organizationService.getAll();
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to fetch organizations', error);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    const defaultOrgId = organizations.length > 0 ? organizations[0].orgId : 0;
    setFormData({ orgId: defaultOrgId, name: '', address: '', geoLocation: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.siteId);

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
        setSites(sites.filter(site => site.siteId !== deleteTargetId));
        showNotification('Site deleted successfully!', 'success');
      } catch (e: any) {
        console.error('Failed to delete site', e);
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
    let submitOrgId = formData.orgId;
    if (submitOrgId === 0 && organizations.length === 1) {
      submitOrgId = organizations[0].orgId;
    }

    if (submitOrgId === 0) {
      showNotification('Please select an organization', 'warning');
      return;
    }

    try {
      if (editingId) {
        await siteService.update(editingId, {
          orgId: submitOrgId,
          name: formData.name,
          address: formData.address,
          geoLocation: formData.geoLocation || '0,0',
        });
      } else {
        await siteService.create({
          orgId: submitOrgId,
          name: formData.name,
          address: formData.address,
          geoLocation: formData.geoLocation || '0,0',
        });
      }
      setIsModalOpen(false);
      fetchSites();
      showNotification(editingId ? 'Site updated successfully!' : 'Site created successfully!', 'success');
    } catch (e: any) {
      console.error('Failed to save site', e);
      showNotification('Failed to save site: ' + (e.response?.data?.message || e.message || 'Unknown error'), 'error');
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
        {/* Filter / Search Section */}
        <div className="p-4 border-b border-slate-200 dark:border-border-muted flex flex-wrap gap-3 items-center bg-slate-50 dark:bg-zinc-900/30">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
              placeholder="Search by name or ID..."
            />
          </div>

          {/* Filter Organization */}
          <select
            value={filterOrgId || ''}
            onChange={(e) => setFilterOrgId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="">All Organizations</option>
            {organizations.map(org => (
              <option key={org.orgId} value={org.orgId}>{org.name}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="siteId">Default</option>
            <option value="name">Name</option>
            <option value="address">Address</option>
            <option value="orgId">Organization</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white transition-all flex items-center gap-1"
            title="Toggle sort order"
          >
            <span className="material-symbols-outlined text-sm">
              {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
            {sortOrder.toUpperCase()}
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchSites()}
            className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-border-muted rounded-lg text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p>Loading sites...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg m-4 border border-red-500/20">
            <p className="font-bold">Error loading data</p>
            <p className="text-sm opacity-80 mt-1">{error}</p>
            <button onClick={() => fetchSites()} className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="border-b border-slate-200 dark:border-border-muted bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Organization</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Site Name</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Address</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-center">Hubs</th>
                  {canEdit && <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-muted">
                {sites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No sites found matching your search.
                    </td>
                  </tr>
                ) : sites.map(site => (
                  <tr key={site.siteId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs whitespace-nowrap text-slate-700 dark:text-slate-300">{site.orgName}</td>
                    <td className="px-6 py-4 text-sm font-medium min-w-[200px] text-slate-900 dark:text-white">
                      {site.name}
                      {site.geoLocation && (
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">location_on</span>
                          {site.geoLocation}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{site.address}</td>
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Site' : 'Add New Site'}>
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
              {editingId ? 'Save Changes' : 'Add Site'}
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
    </Layout>
  );
};

export default SitesPage;
