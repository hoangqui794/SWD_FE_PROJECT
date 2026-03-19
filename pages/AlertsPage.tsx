
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

import { alertService, AlertRule, CreateAlertRuleRequest } from '../services/alertService';
import { notificationService, NotificationHistoryItem } from '../services/notificationService';
import { sensorService, Sensor } from '../services/sensorService';
import { signalRService } from '../services/signalrService';
import { siteService, Site } from '../services/siteService';

const AlertsPage: React.FC = () => {
    const { hasRole } = useAuth();
    const { showNotification } = useNotification();
    const canManage = hasRole(['ADMIN', 'MANAGER']);
    const isAdmin = hasRole(['ADMIN']);

    // Tabs: 'history' or 'rules'
    const [activeTab, setActiveTab] = useState<'history' | 'rules'>('history');

    // --- Common State ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Alert History State ---
    const [alerts, setAlerts] = useState<NotificationHistoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [alertToDelete, setAlertToDelete] = useState<number | null>(null);
    const [resolveConfirmId, setResolveConfirmId] = useState<number | null>(null);
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<number>(0);
    const [hubs, setHubs] = useState<any[]>([]);
    const [selectedHubId, setSelectedHubId] = useState<number>(0);
    const [selectedSeverity, setSelectedSeverity] = useState<string>("");
    const [historySortBy, setHistorySortBy] = useState<'sentAt' | 'severity' | 'isRead'>('sentAt');
    const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('desc');
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");

    // --- Alert Rules State ---
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isSubmittingRule, setIsSubmittingRule] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<number | null>(null); // State to track editing
    const [ruleSearchTerm, setRuleSearchTerm] = useState("");
    const [rulePriorityFilter, setRulePriorityFilter] = useState("All");
    const [ruleSortBy, setRuleSortBy] = useState<'ruleId' | 'name' | 'priority' | 'isActive' | 'sensorId'>('ruleId');
    const [ruleSortOrder, setRuleSortOrder] = useState<'asc' | 'desc'>('asc');
    const ruleSearchDebounce = useRef<ReturnType<typeof setTimeout>>();
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

    // --- API Calls ---

    const fetchAlerts = async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const response = await notificationService.getHistory({
                page: currentPage,
                pageSize: pageSize,
                siteId: selectedSiteId > 0 ? selectedSiteId : undefined,
                hubId: selectedHubId > 0 ? selectedHubId : undefined,
                severity: selectedSeverity || undefined,
                from: dateFrom || undefined,
                to: dateTo || undefined,
                sortBy: historySortBy,
                sortOrder: historySortOrder
            });

            setAlerts(response.data);
            setTotalCount(response.totalCount);
        } catch (error) {
            console.error("Failed to fetch alerts", error);
            setError('Failed to load alerts history.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRules = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError(null);
        try {
            const data = await alertService.getRules({
                search: ruleSearchTerm || undefined,
                priority: rulePriorityFilter !== 'All' ? rulePriorityFilter : undefined,
                sortBy: ruleSortBy,
                sortOrder: ruleSortOrder,
            });
            setRules(data);
        } catch (error) {
            console.error("Failed to fetch rules", error);
            setError('Failed to load alert rules.');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [ruleSearchTerm, rulePriorityFilter, ruleSortBy, ruleSortOrder]);

    // Debounce for rule search
    useEffect(() => {
        if (activeTab !== 'rules') return;
        clearTimeout(ruleSearchDebounce.current);
        ruleSearchDebounce.current = setTimeout(() => {
            fetchRules();
        }, 400);
        return () => clearTimeout(ruleSearchDebounce.current);
    }, [fetchRules, activeTab]);

    const fetchSensors = async () => {
        try {
            const data = await sensorService.getAll();
            setSensors(data);
        } catch (error) {
            console.error("Failed to fetch sensors", error);
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

    const fetchHubsForSite = async (siteId: number) => {
        try {
            const siteData = await siteService.getById(siteId);
            setHubs(siteData.hubs || []);
        } catch (error) {
            console.error("Failed to fetch hubs for site", error);
        }
    };

    // --- Effects ---

    // Fetch hubs when site changes
    useEffect(() => {
        if (selectedSiteId > 0) {
            fetchHubsForSite(selectedSiteId);
        } else {
            setHubs([]);
            setSelectedHubId(0);
        }
    }, [selectedSiteId]);

    // Fetch data based on active tab
    useEffect(() => {
        signalRService.startConnection(); // Ensure SignalR is connected for real-time alerts
        fetchSites(); // Always fetch sites for the filter
        if (activeTab === 'history') {
            fetchAlerts();
        } else {
            fetchRules();
            fetchSensors(); // Load sensors for dropdown
        }
    }, [activeTab, currentPage, selectedSiteId, selectedHubId, selectedSeverity, dateFrom, dateTo, historySortBy, historySortOrder]);

    // Real-time updates via SignalR
    useEffect(() => {
        const handleRealtimeUpdate = (data: any) => {
            console.log("AlertsPage: SignalR update received", data);
            // Refresh current view
            if (activeTab === 'history') {
                // If the signalr data is a new alert object, prepend it
                if (data && typeof data === 'object' && data.id) {
                    setAlerts(prev => {
                        // Avoid duplicates
                        if (prev.find(a => a.id === data.id)) return prev;
                        // Add new alert to the start and keep page size parity
                        const updated = [data, ...prev];
                        return updated.slice(0, pageSize);
                    });
                    setTotalCount(prev => prev + 1);
                } else {
                    fetchAlerts(true); // Silent refresh
                }
            } else {
                fetchRules(); // Rules usually change less frequently, but could also be silent
            }
        };

        signalRService.on("ReceiveAlertNotification", handleRealtimeUpdate);
        signalRService.on("receivealertnotification", handleRealtimeUpdate);

        return () => {
            signalRService.off("ReceiveAlertNotification", handleRealtimeUpdate);
            signalRService.off("receivealertnotification", handleRealtimeUpdate);
        };
    }, [activeTab, currentPage, searchTerm]);

    // --- Helpers ---

    const getSeverityStyle = (severity: string) => {
        const s = (severity || '').toLowerCase();
        if (s === 'high' || s === 'critical') return 'bg-red-500/10 border-red-500 text-red-500';
        if (s === 'medium' || s === 'warning') return 'bg-yellow-500/10 border-yellow-500 text-yellow-500';
        if (s === 'low' || s === 'info') return 'bg-blue-500/10 border-blue-500 text-blue-500';
        return 'bg-slate-500/10 border-slate-500 text-slate-500';
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

    const resetRuleForm = () => {
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
    };

    const handleOpenCreateRule = () => {
        resetRuleForm();
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
            resetRuleForm(); // Reset form without reopening
        } catch (error: any) {
            console.error(editingRuleId ? "Update rule failed" : "Create rule failed", error);
            showNotification((editingRuleId ? 'Update failed: ' : 'Create failed: ') + (error.response?.data?.message || error.message), 'error');
        } finally {
            setIsSubmittingRule(false);
        }
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
                        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Alerts</h3>
                        <p className="text-slate-500 text-sm mt-1">Monitor anomalies and configure alert rules.</p>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-border-muted">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'history'
                                ? 'bg-white dark:bg-primary/20 text-primary shadow-sm dark:shadow-none'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Alert History
                        </button>
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'rules'
                                ? 'bg-white dark:bg-primary/20 text-primary shadow-sm dark:shadow-none'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Alert Rules
                        </button>
                    </div>
                </div>

                {/* Create Rule Button (Shortcut for Mobile) */}
                {activeTab === 'history' && canManage && (
                    <div className="flex md:hidden justify-end">
                        <button
                            onClick={() => { setActiveTab('rules'); setIsRuleModalOpen(true); }}
                            className="px-4 py-2 bg-primary/10 text-primary border border-primary/50 rounded text-xs font-bold uppercase hover:bg-primary/20 transition-all"
                        >
                            + New Rule
                        </button>
                    </div>
                )}

                {/* Toolbar (Only for Rules) */}
                {activeTab === 'rules' && canManage && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleOpenCreateRule}
                            className="px-4 py-2 bg-slate-900 dark:bg-primary text-white dark:text-black rounded-lg text-xs font-bold uppercase hover:bg-black dark:hover:bg-primary-light transition-all shadow-lg shadow-slate-900/10 dark:shadow-primary/20 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Create Alert Rule
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-border-muted overflow-hidden relative min-h-[400px] shadow-sm transition-colors">
                {/* Loading */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/80 dark:bg-background-dark/80 flex items-center justify-center transition-colors">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Loading data...</p>
                        </div>
                    </div>
                )}

                {/* TAB 1: HISTORY TABLE */}
                {activeTab === 'history' && !isLoading && (
                    <>
                        <div className="p-4 border-b border-slate-200 dark:border-border-muted flex flex-wrap gap-3 items-center bg-slate-50/50 dark:bg-zinc-900/40 backdrop-blur-sm">
                            {/* Search Input */}
                            <div className="relative flex-1 min-w-[200px] max-w-xs group">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary text-sm transition-colors">search</span>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>

                            {/* Site Filter */}
                            <div className="relative">
                                <select
                                    value={selectedSiteId}
                                    onChange={(e) => { setSelectedSiteId(Number(e.target.value)); setSelectedHubId(0); setCurrentPage(1); }}
                                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-3 pr-10 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer min-w-[140px]"
                                >
                                    <option value="0">All Stores</option>
                                    {sites.map(site => (
                                        <option key={site.siteId} value={site.siteId}>{site.name}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">location_on</span>
                            </div>

                            {/* Hub Filter - New */}
                            <div className="relative">
                                <select
                                    disabled={selectedSiteId === 0}
                                    value={selectedHubId}
                                    onChange={(e) => { setSelectedHubId(Number(e.target.value)); setCurrentPage(1); }}
                                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-3 pr-10 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer min-w-[140px] disabled:opacity-50"
                                >
                                    <option value="0">All Hubs</option>
                                    {hubs.map(hub => (
                                        <option key={hub.hubId} value={hub.hubId}>{hub.name}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">router</span>
                            </div>

                            {/* Severity Filter - New */}
                            <div className="relative">
                                <select
                                    value={selectedSeverity}
                                    onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }}
                                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-3 pr-10 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer min-w-[120px]"
                                >
                                    <option value="">All Severity</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">error</span>
                            </div>

                            {/* Sort Controls */}
                            <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg overflow-hidden group">
                                <select
                                    value={historySortBy}
                                    onChange={(e) => { setHistorySortBy(e.target.value as any); setCurrentPage(1); }}
                                    className="bg-transparent pl-3 pr-8 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer border-r border-slate-200 dark:border-border-muted"
                                >
                                    <option value="sentAt">Time</option>
                                    <option value="severity">Severity</option>
                                    <option value="isRead">Status</option>
                                </select>
                                <button
                                    onClick={() => { setHistorySortOrder(o => o === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}
                                    className="px-3 py-1.5 text-slate-400 hover:text-primary transition-colors flex items-center"
                                >
                                    <span className="material-symbols-outlined text-sm font-bold">
                                        {historySortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                    </span>
                                </button>
                            </div>

                            {/* Date Filters - New */}
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-2 py-1">
                                <input 
                                    type="datetime-local" 
                                    value={dateFrom}
                                    onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                                    className="bg-transparent text-[10px] text-slate-500 outline-none"
                                />
                                <span className="text-slate-400">→</span>
                                <input 
                                    type="datetime-local" 
                                    value={dateTo}
                                    onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                                    className="bg-transparent text-[10px] text-slate-500 outline-none"
                                />
                            </div>

                            {/* Refresh */}
                            <button
                                onClick={() => fetchAlerts()}
                                className="w-9 h-8 flex items-center justify-center bg-primary text-black rounded-lg hover:bg-primary-light transition-all shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">refresh</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Time</th>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Sensor</th>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Message</th>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Severity</th>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Status</th>
                                        {canManage && <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-border-muted text-left">
                                    {(activeTab === 'history' ? alerts.filter(a => 
                                        !searchTerm || 
                                        a.sensorName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        a.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        a.location?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ) : alerts).map((alert) => (
                                        <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-300">
                                                {new Date(alert.time).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{alert.sensorName}</span>
                                                    <span className="text-[10px] text-slate-500 lowercase">{alert.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-normal min-w-[300px] block" title={alert.message}>
                                                    {alert.message}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 border text-[10px] font-bold uppercase rounded-md shadow-sm ${getSeverityStyle(alert.severity)}`}>
                                                    {alert.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-2 text-[10px] font-bold uppercase ${alert.status?.toLowerCase() === 'active' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${alert.status?.toLowerCase() === 'active' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                                                    {alert.status}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleDeleteAlert(alert.id)}
                                                            className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-lg transition-all"
                                                            title="Delete Alert"
                                                        >
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
                            <div className="p-4 border-t border-slate-200 dark:border-border-muted bg-slate-50/50 dark:bg-zinc-900/30 flex justify-center gap-2">
                                <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} className="px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-transparent rounded-lg disabled:opacity-50 text-xs text-slate-600 dark:text-white transition-all hover:bg-slate-50">
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                <span className="px-3 py-1 text-xs text-slate-500 self-center font-medium">Page {currentPage} of {totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} className="px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-transparent rounded-lg disabled:opacity-50 text-xs text-slate-600 dark:text-white transition-all hover:bg-slate-50">
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* TAB 2: RULES TABLE */}
                {activeTab === 'rules' && !isLoading && (
                    <>
                        <div className="p-4 border-b border-slate-200 dark:border-border-muted flex flex-wrap gap-2 items-center bg-slate-50/50 dark:bg-zinc-900/40 backdrop-blur-sm">
                            {/* Search Input - Replicated from image */}
                            <div className="relative flex-1 min-w-[280px] max-w-sm group">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary text-sm transition-colors">search</span>
                                <input
                                    type="text"
                                    placeholder="Search by name or ID..."
                                    value={ruleSearchTerm}
                                    onChange={(e) => setRuleSearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>

                            {/* Priority Filter Dropdown */}
                            <div className="relative">
                                <select
                                    value={rulePriorityFilter}
                                    onChange={(e) => setRulePriorityFilter(e.target.value)}
                                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer pr-10 min-w-[140px]"
                                >
                                    <option value="All">All Priorities</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">filter_alt</span>
                            </div>

                            {/* Sort By Dropdown */}
                            <div className="relative">
                                <select
                                    value={ruleSortBy}
                                    onChange={(e) => setRuleSortBy(e.target.value as any)}
                                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer pr-10 min-w-[120px]"
                                >
                                    <option value="ruleId">Default</option>
                                    <option value="name">Name</option>
                                    <option value="priority">Priority</option>
                                    <option value="isActive">Status</option>
                                    <option value="sensorId">Sensor</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                            </div>

                            {/* Sort Order Button */}
                            <button
                                onClick={() => setRuleSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                                className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-1.5 text-xs font-black text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">
                                    {ruleSortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                </span>
                                {ruleSortOrder.toUpperCase()}
                            </button>

                            {/* Refresh Button */}
                            <button
                                onClick={() => fetchRules()}
                                title="Refresh Data"
                                className="w-10 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-slate-200 dark:border-border-muted rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-400 hover:text-primary transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Rule Name</th>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Sensor</th>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Condition</th>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Threshold</th>
                                        <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Priority</th>
                                        {canManage && <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-border-muted">
                                    {rules.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-sm">No alert rules found matching your filters.</td></tr>
                                    ) : rules.map((rule) => (
                                        <tr key={rule.ruleId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">{rule.name}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-300">{rule.sensorName}</td>
                                            <td className="px-6 py-4 text-xs text-slate-400 italic">{rule.conditionType}</td>
                                            <td className="px-6 py-4 text-xs font-mono text-primary font-bold">
                                                {rule.minVal} - {rule.maxVal}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 border text-[10px] font-bold uppercase rounded-md shadow-sm ${getSeverityStyle(rule.priority)}`}>
                                                    {rule.priority}
                                                </span>
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
                                </tbody>
                            </table>
                        </div>
                    </>
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
                    <div className="flex items-center gap-4 mb-4 text-emerald-600 dark:text-green-500 bg-emerald-50 dark:bg-green-500/10 p-4 rounded-xl border border-emerald-100 dark:border-green-500/20 shadow-sm">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                        <div>
                            <h4 className="font-bold uppercase text-sm tracking-tight">Resolve Alert</h4>
                            <p className="text-xs opacity-80 mt-1">Mark this issue as resolved?</p>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-300 text-sm mb-6 px-1">This will update the alert status to <span className="font-bold text-emerald-600 dark:text-green-400">"Resolved"</span>.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setResolveConfirmId(null)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-white rounded-lg text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                        <button onClick={confirmResolve} className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">Yes, Resolve</button>
                    </div>
                </div>
            </Modal>

            {/* 2. Create Rule Modal */}
            <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title={editingRuleId ? "Edit Alert Rule" : "Create Alert Rule"}>
                <form onSubmit={handleCreateRule} className="p-6 space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Rule Name</label>
                        <input
                            required
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="e.g. High Temp Warning"
                            value={ruleFormData.name}
                            onChange={e => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                        />
                    </div>

                    {!editingRuleId && (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Target Sensor</label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white appearance-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                    value={ruleFormData.sensorId}
                                    onChange={e => setRuleFormData({ ...ruleFormData, sensorId: Number(e.target.value) })}
                                >
                                    <option value={0} className="bg-white text-slate-400">-- Select Sensor --</option>
                                    {sensors.length > 0 ? (
                                        sensors.map(s => (
                                            <option key={s.sensorId} value={s.sensorId} className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                                                {s.sensorName} ({s.hubName})
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled className="bg-white text-slate-400">Loading sensors...</option>
                                    )}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Min Value</label>
                            <input type="number" step="0.1"
                                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                value={ruleFormData.minVal}
                                onChange={e => setRuleFormData({ ...ruleFormData, minVal: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Max Value</label>
                            <input type="number" step="0.1"
                                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                value={ruleFormData.maxVal}
                                onChange={e => setRuleFormData({ ...ruleFormData, maxVal: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Priority</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white appearance-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                    value={ruleFormData.priority}
                                    onChange={e => setRuleFormData({ ...ruleFormData, priority: e.target.value })}
                                >
                                    <option value="High" className="bg-white dark:bg-zinc-800">High</option>
                                    <option value="Medium" className="bg-white dark:bg-zinc-800">Medium</option>
                                    <option value="Low" className="bg-white dark:bg-zinc-800">Low</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Notify Via</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white appearance-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                    value={ruleFormData.notificationMethod}
                                    onChange={e => setRuleFormData({ ...ruleFormData, notificationMethod: e.target.value })}
                                >
                                    <option value="Email" className="bg-white dark:bg-zinc-800">Email</option>
                                    <option value="SMS" className="bg-white dark:bg-zinc-800">SMS</option>
                                    <option value="All" className="bg-white dark:bg-zinc-800">All Channels</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3 border-t border-slate-100 dark:border-border-muted mt-2">
                        <button type="button" onClick={() => setIsRuleModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                        <button disabled={isSubmittingRule} type="submit" className="flex-1 px-4 py-2.5 bg-slate-900 dark:bg-primary text-white dark:text-black rounded-lg text-xs font-bold uppercase hover:bg-black dark:hover:bg-primary-light disabled:opacity-50 shadow-lg shadow-slate-900/10 dark:shadow-primary/20 transition-all">
                            {isSubmittingRule ? 'Saving...' : (editingRuleId ? 'Update Rule' : 'Create Rule')}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default AlertsPage;
