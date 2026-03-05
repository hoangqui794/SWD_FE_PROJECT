import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { userService, User, CreateUserRequest } from '../services/userService';
import { siteService, Site } from '../services/siteService';
import { useNotification } from '../context/NotificationContext';

const UsersPage: React.FC = () => {
  const { showNotification } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'' | 'true' | 'false'>('');
  const [sortBy, setSortBy] = useState<'userId' | 'fullName' | 'email' | 'isActive' | 'roleId'>('userId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [statusConfirmUser, setStatusConfirmUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<CreateUserRequest>({
    fullName: '',
    email: '',
    roleId: 3,
    orgId: 1,
    siteId: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const params: any = { sortBy, sortOrder };
      if (searchTerm) params.search = searchTerm;
      if (filterActive !== '') params.isActive = filterActive === 'true';
      const data = await userService.getAll(params);
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      setError('Failed to load users. Please check connection.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [searchTerm, filterActive, sortBy, sortOrder]);

  useEffect(() => {
    fetchSites();
  }, []);

  // Re-fetch với debounce khi filter thay đổi
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [fetchUsers]);

  const fetchSites = async () => {
    try {
      const data = await siteService.getAll();
      setSites(data);
    } catch (e) {
      console.error('Failed to fetch sites', e);
    }
  };

  const handleAddNew = () => {
    setEditingUserId(null);
    setFormData({ fullName: '', email: '', roleId: 3, orgId: 1, siteId: 0 });
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.userId);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      orgId: user.orgId,
      siteId: user.siteId || 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) {
      showNotification('Please fill in name and email', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUserId) {
        await userService.update(editingUserId, {
          fullName: formData.fullName,
          siteId: formData.siteId === 0 ? null : formData.siteId
        });
        showNotification('User updated successfully!', 'success');
      } else {
        await userService.create(formData);
        showNotification('User created successfully!', 'success');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to save user', error);
      showNotification('Failed to save user: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateStatusChange = (user: User) => {
    setStatusConfirmUser(user);
  };

  const confirmStatusChange = async () => {
    if (!statusConfirmUser) return;
    const user = statusConfirmUser;

    try {
      if (user.isActive) {
        const data = await userService.deactivate(user.userId);
        showNotification(data.message || `Deactivated user ${user.fullName}`, 'success');
      } else {
        const data = await userService.activate(user.userId);
        showNotification(data.message || `Activated user ${user.fullName}`, 'success');
      }
      setUsers(users.map(u => u.userId === user.userId ? { ...u, isActive: !u.isActive } : u));
    } catch (error: any) {
      console.error('Failed to change user status', error);
      const msg = error.response?.data?.message || error.message;
      if (error.response?.status === 400 && !user.isActive) {
        showNotification(msg, 'warning');
        setUsers(users.map(u => u.userId === user.userId ? { ...u, isActive: true } : u));
      } else {
        showNotification('Failed to change status: ' + msg, 'error');
      }
    } finally {
      setStatusConfirmUser(null);
    }
  };

  return (
    <Layout title="Users" breadcrumb="Administration">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">IoT Users Administration</h3>
          <p className="text-slate-500 text-sm mt-1">Manage system access for organizations and site staff.</p>
        </div>
        <button onClick={handleAddNew} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-slate-200 transition-all rounded shadow-lg shadow-slate-900/10 dark:shadow-none text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">person_add</span> Create User
        </button>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-border-muted overflow-hidden transition-colors shadow-sm">
        {/* Filter / Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-border-muted flex flex-wrap gap-3 items-center bg-slate-50 dark:bg-zinc-900/30">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
              placeholder="Search by name or email..."
            />
          </div>

          {/* Filter Active */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as '' | 'true' | 'false')}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="userId">Default</option>
            <option value="fullName">Full Name</option>
            <option value="email">Email</option>
            <option value="isActive">Status</option>
            <option value="roleId">Role</option>
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
            onClick={() => fetchUsers()}
            className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-border-muted rounded-lg text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p>Loading users...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg m-4 border border-red-500/20">
            <p className="font-bold">Error loading data</p>
            <p className="text-sm opacity-80 mt-1">{error}</p>
            <button onClick={() => fetchUsers()} className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Full Name</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Email</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Role</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Site</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Status</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-muted">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">No users found.</td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.userId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{user.fullName}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-white/10 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-white border border-slate-200 dark:border-transparent">
                        {user.roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {user.siteName || <span className="text-slate-300 dark:text-slate-600 italic">Head Office</span>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => initiateStatusChange(user)}
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-md transition-all shadow-sm ${user.isActive
                          ? 'text-emerald-600 dark:text-green-500 bg-emerald-50 dark:bg-green-500/10 border border-emerald-100 dark:border-green-500/20 hover:bg-emerald-100 dark:hover:bg-green-500/20'
                          : 'text-rose-600 dark:text-red-500 bg-rose-50 dark:bg-red-500/10 border border-rose-100 dark:border-red-500/20 hover:bg-rose-100 dark:hover:bg-red-500/20'
                          }`}
                        title={user.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUserId ? 'Edit User' : 'Create User'}>
        <form className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</label>
            <input
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
              placeholder="e.g. Robert Smith"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email</label>
            <input
              type="email"
              placeholder="r.smith@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!editingUserId}
              className={`w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors ${editingUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role</label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
                disabled={!!editingUserId}
                className={`w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors ${editingUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value={1} className="dark:bg-zinc-800">Admin</option>
                <option value={2} className="dark:bg-zinc-800">Manager</option>
                <option value={3} className="dark:bg-zinc-800">Staff</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assigned Site</label>
              <select
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: Number(e.target.value) })}
              >
                <option value={0} className="dark:bg-zinc-800">-- No Site (Head Office) --</option>
                {sites.map(site => (
                  <option key={site.siteId} value={site.siteId} className="dark:bg-zinc-800">{site.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold uppercase hover:bg-black dark:hover:bg-slate-200 transition-all shadow-lg shadow-slate-900/10 dark:shadow-none disabled:opacity-50"
              type="button"
            >
              {isSubmitting ? 'Saving...' : (editingUserId ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <Modal isOpen={!!statusConfirmUser} onClose={() => setStatusConfirmUser(null)} title={statusConfirmUser?.isActive ? 'Deactivate User' : 'Activate User'}>
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${statusConfirmUser?.isActive ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
              <span className={`material-symbols-outlined text-2xl ${statusConfirmUser?.isActive ? 'text-rose-500' : 'text-emerald-500'}`}>
                {statusConfirmUser?.isActive ? 'block' : 'check_circle'}
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              {statusConfirmUser?.isActive ? 'Deactivate User?' : 'Activate User?'}
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {statusConfirmUser?.isActive
                ? `Are you sure you want to deactivate ${statusConfirmUser?.fullName}? They will not be able to log in.`
                : `Are you sure you want to activate ${statusConfirmUser?.fullName}? They will be able to log in.`}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStatusConfirmUser(null)}
              className="flex-1 px-6 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmStatusChange}
              className={`flex-1 px-6 py-2.5 text-white rounded-lg text-xs font-bold uppercase shadow-lg transition-all ${statusConfirmUser?.isActive
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                }`}
            >
              {statusConfirmUser?.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default UsersPage;
