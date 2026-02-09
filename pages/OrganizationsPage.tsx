import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { organizationService, Organization } from '../services/organizationService';

const OrganizationsPage: React.FC = () => {
    const { hasRole } = useAuth();
    const { showNotification } = useNotification();
    const isAdmin = hasRole(['ADMIN']);
    const canEdit = hasRole(['ADMIN', 'MANAGER']);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    // Delete Confirmation State
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await organizationService.getAll();
            setOrganizations(data);
        } catch (error) {
            console.error("Failed to fetch organizations", error);
            setError('Connection error. Please check your backend server.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({ name: "", description: "" });
        setIsModalOpen(true);
    };

    const handleEdit = (org: Organization) => {
        setEditingId(org.orgId);
        setFormData({
            name: org.name,
            description: org.description
        });
        setIsModalOpen(true);
    };

    const initiateDelete = (id: number) => {
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (deleteTargetId) {
            try {
                await organizationService.delete(deleteTargetId);
                setOrganizations(organizations.filter(org => org.orgId !== deleteTargetId));
                showNotification('Organization deleted successfully!', 'success');
            } catch (e: any) {
                console.error("Failed to delete organization", e);
                const msg = e.response?.data?.message || e.message || "Unknown error";
                showNotification(`Failed to delete organization: ${msg}`, 'error');
            } finally {
                setDeleteTargetId(null);
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showNotification("Organization name is required", "warning");
            return;
        }

        try {
            if (editingId) {
                await organizationService.update(editingId, {
                    name: formData.name,
                    description: formData.description
                });
                showNotification("Organization updated successfully!", "success");
            } else {
                await organizationService.create({
                    name: formData.name,
                    description: formData.description
                });
                showNotification("Organization created successfully!", "success");
            }
            setIsModalOpen(false);
            fetchOrganizations();
        } catch (e: any) {
            console.error("Failed to save organization", e);
            const errorMsg = e.response?.data?.message || e.message || "Unknown error";
            showNotification(`Failed to save organization: ${errorMsg}`, 'error');
        }
    };

    return (
        <Layout title="Organizations" breadcrumb="Administration">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Organizations Management</h3>
                    <p className="text-slate-500 text-sm mt-1">Manage tenant organizations and their details.</p>
                </div>
                {isAdmin && (
                    <button onClick={handleAddNew} className="px-4 py-2 bg-white text-black hover:bg-slate-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">add</span> Add Organization
                    </button>
                )}
            </div>

            <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading organizations...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg m-4 border border-red-500/20">
                        <p className="font-bold">Error loading data</p>
                        <p className="text-sm opacity-80 mt-1">{error}</p>
                        <button onClick={fetchOrganizations} className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">Retry</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-900/50 border-b border-border-muted">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sites</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created At</th>
                                    {canEdit && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-muted">
                                {organizations.map((org) => (
                                    <tr key={org.orgId} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-white">{org.orgId}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-white">{org.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">{org.description}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-center text-white">{org.siteCount}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(org.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        {canEdit && (
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(org)}
                                                    className="text-slate-500 hover:text-white transition-colors"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => initiateDelete(org.orgId)}
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
                                {organizations.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No organizations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Organization" : "Add Organization"}>
                <form className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization Name</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white"
                            placeholder="e.g. Acme Corp"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-zinc-900 border border-border-muted rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-white h-24"
                            placeholder="Brief description of the organization..."
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
                            {editingId ? "Save Changes" : "Create"}
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
                        <h4 className="text-lg font-bold text-white">Delete Organization?</h4>
                        <p className="text-slate-400 text-sm">
                            Are you sure you want to delete this organization? This action cannot be undone and may affect associated sites and users.
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

export default OrganizationsPage;
