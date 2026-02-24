
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

import { alertService, Alert, AlertRule, CreateAlertRuleRequest } from '../services/alertService';
import { sensorService, Sensor } from '../services/sensorService';

const AlertsPage: React.FC = () => {
    const { hasRole } = useAuth();
    const { showNotification } = useNotification();
    const canManage = hasRole(['ADMIN', 'MANAGER']);

    // Tabs: 'history' or 'rules'
    const [activeTab, setActiveTab] = useState<'history' | 'rules'>('history');

    // --- Common State ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Alert History State ---
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Resolved'>('All');
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [alertToDelete, setAlertToDelete] = useState<number | null>(null);
    const [resolveConfirmId, setResolveConfirmId] = useState<number | null>(null);

    // --- Alert Rules State ---
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isSubmittingRule, setIsSubmittingRule] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<number | null>(null); // State to track editing
    const [ruleFormData, setRuleFormData] = useState<CreateAlertRuleRequest>({
        sensorId: 0,
        name: '',
        conditionType: 'MinMax',
        minVal: 0,
        maxVal: 100,
        notificationMethod: 'Email',
        priority: 'Warning'
    });

    // Derived state
    const totalPages = Math.ceil(totalCount / pageSize);

    // --- Effects ---



    // Fetch data based on active tab
    useEffect(() => {
        if (activeTab === 'history') {
            fetchAlerts();
        } else {
            fetchRules();
            fetchSensors(); // Load sensors for dropdown
        }
    }, [activeTab, filterStatus, searchTerm, currentPage]);

    // --- Helpers ---



    const getSeverityStyle = (severity: string) => {
        const s = (severity || '').toLowerCase();
        if (s === 'high' || s === 'critical') return 'bg-red-500/10 border-red-500 text-red-500';
        if (s === 'medium' || s === 'warning') return 'bg-yellow-500/10 border-yellow-500 text-yellow-500';
        if (s === 'low' || s === 'info') return 'bg-blue-500/10 border-blue-500 text-blue-500';
        return 'bg-slate-500/10 border-slate-500 text-slate-500';
    };

    // --- API Calls ---

    const fetchAlerts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await alertService.getAll(filterStatus, searchTerm);
            setAlerts(data);
            setTotalCount(data.length);
        } catch (error) {
            console.error("Failed to fetch alerts", error);
            setError('Failed to load alerts history.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRules = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await alertService.getRules();
            setRules(data);
        } catch (error) {
            console.error("Failed to fetch rules", error);
            setError('Failed to load alert rules.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSensors = async () => {
        try {
            const data = await sensorService.getAll();
            setSensors(data);
        } catch (error) {
            console.error("Failed to fetch sensors", error);
        }
    };

    // --- Handlers: History ---

    const initiateResolve = (id: number) => {
        setResolveConfirmId(id);
    };

    const confirmResolve = async () => {
        if (!resolveConfirmId) return;
        try {
            const response = await alertService.resolve(resolveConfirmId);
            setAlerts(alerts.map(a => a.id === resolveConfirmId ? { ...a, status: 'Resolved' } : a));
            showNotification(response.message || "Alert resolved successfully!", 'success');
        } catch (error: any) {
            showNotification('Failed to resolve: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setResolveConfirmId(null);
        }
    };

    const handleDeleteAlert = (id: number) => setAlertToDelete(id);

    const confirmDeleteAlert = async () => {
        if (alertToDelete === null) return;
        try {
            await alertService.delete(alertToDelete);
            setAlerts(alerts.filter(a => a.id !== alertToDelete));
            setTotalCount(prev => prev - 1);
            setAlertToDelete(null);
            showNotification("Alert log deleted!", 'success');
        } catch (error: any) {
            setAlertToDelete(null);
            showNotification('Delete failed: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

    // --- Handlers: Rules ---

    const handleOpenCreateRule = () => {
        setEditingRuleId(null);
        setRuleFormData({
            sensorId: 0,
            name: '',
            conditionType: 'MinMax',
            minVal: 0,
            maxVal: 100,
            notificationMethod: 'Email',
            priority: 'Warning'
        });
        setIsRuleModalOpen(true);
    };

    const handleEditRule = (rule: AlertRule) => {
        setEditingRuleId(rule.ruleId);
        setRuleFormData({
            sensorId: rule.sensorId,
            name: rule.name,
            conditionType: rule.conditionType,
            minVal: rule.minVal,
            maxVal: rule.maxVal,
            notificationMethod: rule.notificationMethod,
            priority: rule.priority
        });
        setIsRuleModalOpen(true);
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleFormData.name || ruleFormData.sensorId === 0) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        setIsSubmittingRule(true);
        try {
            if (editingRuleId) {
                await alertService.updateRule(editingRuleId, ruleFormData);
                showNotification('Alert rule updated successfully!', 'success');
            } else {
                await alertService.createRule(ruleFormData);
                showNotification('Alert rule created successfully!', 'success');
            }

            setIsRuleModalOpen(false);
            fetchRules(); // Refresh list
            handleOpenCreateRule(); // Reset form
        } catch (error: any) {
            console.error(editingRuleId ? "Update rule failed" : "Create rule failed", error);
            showNotification((editingRuleId ? 'Update failed: ' : 'Create failed: ') + (error.response?.data?.message || error.message), 'error');
        } finally {
            setIsSubmittingRule(false);
        }
    };

    // --- Pagination Logic ---
    const getPaginatedAlerts = () => {
        const startIndex = (currentPage - 1) * pageSize;
        return alerts.slice(startIndex, startIndex + pageSize);
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <Layout title="Alert Management" breadcrumb="Monitoring">
            {/* Header & Tabs */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">System Alerts</h3>
                        <p className="text-slate-500 text-sm mt-1">Monitor anomalies and configure alert rules.</p>
                    </div>

                    <div className="flex bg-zinc-900 p-1 rounded-lg border border-border-muted">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${activeTab === 'history'
                                ? 'bg-primary/20 text-primary shadow-lg shadow-primary/5'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Alert History
                        </button>
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${activeTab === 'rules'
                                ? 'bg-primary/20 text-primary shadow-lg shadow-primary/5'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Alert Rules
                        </button>
                    </div>
                </div>

                {/* Filters (Only for History) */}
                {activeTab === 'history' && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-2">
                            {['All', 'Active', 'Resolved'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => { setFilterStatus(status as any); setCurrentPage(1); }}
                                    className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${filterStatus === status
                                        ? 'bg-white text-black shadow-lg shadow-white/10'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        {/* Create Rule Button (Shortcut) */}
                        {canManage && (
                            <button
                                onClick={() => { setActiveTab('rules'); setIsRuleModalOpen(true); }}
                                className="md:hidden px-4 py-2 bg-primary/10 text-primary border border-primary/50 rounded text-xs font-bold uppercase hover:bg-primary/20 transition-all"
                            >
                                + New Rule
                            </button>
                        )}
                    </div>
                )}

                {/* Toolbar (Only for Rules) */}
                {activeTab === 'rules' && canManage && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleOpenCreateRule}
                            className="px-4 py-2 bg-primary text-black rounded text-xs font-bold uppercase hover:bg-primary-light transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Create Alert Rule
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden relative min-h-[400px]">
                {/* Loading */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-background-dark/80 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-sm text-slate-400">Loading data...</p>
                        </div>
                    </div>
                )}

                {/* TAB 1: HISTORY TABLE */}
                {activeTab === 'history' && !isLoading && (
                    <>
                        <div className="p-4 border-b border-border-muted flex gap-4 items-center justify-between bg-zinc-900/30">
                            <div className="relative w-full max-w-sm">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full bg-background-dark border-border-muted text-xs rounded pl-10 focus:ring-1 focus:ring-primary h-9"
                                    placeholder="Search by sensor name..."
                                />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                Showing {totalCount > 0 ? ((currentPage - 1) * pageSize) + 1 : 0}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                                <button onClick={fetchAlerts} className="ml-2 p-1 hover:text-white transition-colors" title="Refresh">
                                    <span className="material-symbols-outlined text-sm">refresh</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-zinc-900/50 border-b border-border-muted">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Severity</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        {canManage && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-muted">
                                    {getPaginatedAlerts().map((alert) => (
                                        <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-xs font-mono text-slate-300">
                                                {new Date(alert.time).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-white">{alert.sensor_name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 border text-[10px] font-bold uppercase rounded ${getSeverityStyle(alert.severity)}`}>
                                                    {alert.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-2 text-[10px] font-bold uppercase ${alert.status === 'Active' ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${alert.status === 'Active' ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                                                    {alert.status}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {alert.status === 'Active' && (
                                                            <button onClick={() => initiateResolve(alert.id)} className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/50 rounded hover:bg-green-500/20 text-[10px] font-bold uppercase transition-colors">
                                                                Resolve
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteAlert(alert.id)} className="p-1 text-slate-500 hover:text-red-500 transition-colors">
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {alerts.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No data available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-border-muted bg-zinc-900/30 flex justify-center gap-2">
                                <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-50 text-xs text-white"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                                <span className="px-3 py-1 text-xs text-slate-400 self-center">Page {currentPage} of {totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-50 text-xs text-white"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                            </div>
                        )}
                    </>
                )}

                {/* TAB 2: RULES TABLE */}
                {activeTab === 'rules' && !isLoading && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-zinc-900/50 border-b border-border-muted">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condition</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Threshold</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notify</th>
                                    {canManage && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-muted">
                                {rules.map((rule) => (
                                    <tr key={rule.ruleId} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-white">{rule.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-300">{rule.sensorName}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400 italic">{rule.conditionType}</td>
                                        <td className="px-6 py-4 text-xs font-mono text-primary">
                                            {rule.minVal} - {rule.maxVal}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 border text-[10px] font-bold uppercase rounded ${getSeverityStyle(rule.priority)}`}>
                                                {rule.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">mail</span>
                                            {rule.notificationMethod}
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEditRule(rule)}
                                                    className="p-1 text-slate-500 hover:text-white transition-colors"
                                                    title="Edit Rule"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {rules.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-sm">No alert rules configured yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* 1. Delete Confirm Modal */}
            <Modal isOpen={alertToDelete !== null} onClose={() => setAlertToDelete(null)} title="Confirm Delete">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4 text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                        <span className="material-symbols-outlined text-3xl">warning</span>
                        <div>
                            <h4 className="font-bold uppercase text-sm">Irreversible Action</h4>
                            <p className="text-xs opacity-80 mt-1">This action cannot be undone.</p>
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm mb-6">Are you sure you want to permanently delete this alert log?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setAlertToDelete(null)} className="flex-1 px-4 py-2.5 border border-border-muted text-white rounded text-xs font-bold uppercase hover:bg-white/5">Cancel</button>
                        <button onClick={confirmDeleteAlert} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded text-xs font-bold uppercase hover:bg-red-600 shadow-lg shadow-red-500/20">Delete Log</button>
                    </div>
                </div>
            </Modal>

            {/* 1.5. Resolve Confirm Modal */}
            <Modal isOpen={resolveConfirmId !== null} onClose={() => setResolveConfirmId(null)} title="Confirm Resolve">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4 text-green-500 bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                        <div>
                            <h4 className="font-bold uppercase text-sm">Resolve Alert</h4>
                            <p className="text-xs opacity-80 mt-1">Mark this issue as resolved?</p>
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm mb-6">This will update the alert status to "Resolved".</p>
                    <div className="flex gap-3">
                        <button onClick={() => setResolveConfirmId(null)} className="flex-1 px-4 py-2.5 border border-border-muted text-white rounded text-xs font-bold uppercase hover:bg-white/5">Cancel</button>
                        <button onClick={confirmResolve} className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded text-xs font-bold uppercase hover:bg-green-600 shadow-lg shadow-green-500/20">Yes, Resolve</button>
                    </div>
                </div>
            </Modal>

            {/* 2. Create Rule Modal */}
            <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title={editingRuleId ? "Edit Alert Rule" : "Create Alert Rule"}>
                <form onSubmit={handleCreateRule} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Rule Name</label>
                        <input
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="e.g. High Temp Warning"
                            value={ruleFormData.name}
                            onChange={e => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Sensor</label>
                        <div className="relative">
                            <select
                                required
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-sm text-white appearance-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                value={ruleFormData.sensorId}
                                onChange={e => setRuleFormData({ ...ruleFormData, sensorId: Number(e.target.value) })}
                            >
                                <option value={0} className="bg-zinc-800 text-slate-400">-- Select Sensor --</option>
                                {sensors.length > 0 ? (
                                    sensors.map(s => (
                                        <option key={s.sensorId} value={s.sensorId} className="bg-zinc-800 text-white">
                                            {s.sensorName} ({s.hubName})
                                        </option>
                                    ))
                                ) : (
                                    <option disabled className="bg-zinc-800 text-slate-500">Loading sensors...</option>
                                )}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Min Value</label>
                            <input type="number" step="0.1"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                value={ruleFormData.minVal}
                                onChange={e => setRuleFormData({ ...ruleFormData, minVal: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Max Value</label>
                            <input type="number" step="0.1"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                value={ruleFormData.maxVal}
                                onChange={e => setRuleFormData({ ...ruleFormData, maxVal: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Priority</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-sm text-white appearance-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={ruleFormData.priority}
                                    onChange={e => setRuleFormData({ ...ruleFormData, priority: e.target.value })}
                                >
                                    <option value="High" className="bg-zinc-800">High</option>
                                    <option value="Medium" className="bg-zinc-800">Medium</option>
                                    <option value="Low" className="bg-zinc-800">Low</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Notify Via</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-sm text-white appearance-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={ruleFormData.notificationMethod}
                                    onChange={e => setRuleFormData({ ...ruleFormData, notificationMethod: e.target.value })}
                                >
                                    <option value="Email" className="bg-zinc-800">Email</option>
                                    <option value="SMS" className="bg-zinc-800">SMS</option>
                                    <option value="All" className="bg-zinc-800">All Channels</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3 border-t border-border-muted mt-2">
                        <button type="button" onClick={() => setIsRuleModalOpen(false)} className="flex-1 px-4 py-2.5 border border-zinc-700 text-slate-300 rounded text-xs font-bold uppercase hover:bg-white/5 transition-colors">Cancel</button>
                        <button disabled={isSubmittingRule} type="submit" className="flex-1 px-4 py-2.5 bg-primary text-black rounded text-xs font-bold uppercase hover:bg-primary-light disabled:opacity-50 shadow-lg shadow-primary/20 transition-all">
                            {isSubmittingRule ? 'Saving...' : (editingRuleId ? 'Update Rule' : 'Create Rule')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* 2. Create Rule Modal */}
        </Layout>
    );
};

export default AlertsPage;
