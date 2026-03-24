
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

import { alertService, AlertRule, CreateAlertRuleRequest } from '../services/alertService';
import { notificationService, NotificationHistoryItem } from '../services/notificationService';
import { sensorService, Sensor } from '../services/sensorService';
import { signalRService } from '../services/signalrService';
import { siteService, Site } from '../services/siteService';
import { hubService, Hub } from '../services/hubService';

// --- Local Styled Components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; trend?: string }> = ({ title, value, icon, color, trend }) => (
    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-slate-200 dark:border-border-muted p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100 flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                <span className="material-symbols-outlined text-2xl" style={{ color: color.replace('bg-', '') }}>{icon}</span>
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
);

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
    const s = (severity || '').toLowerCase();
    let styles = "bg-slate-500/10 text-slate-500 border-slate-500/20";
    let icon = "info";

    if (s === 'high' || s === 'critical') {
        styles = "bg-rose-500/10 text-rose-500 border-rose-500/20";
        icon = "emergency_home";
    } else if (s === 'medium' || s === 'warning') {
        styles = "bg-amber-500/10 text-amber-500 border-amber-500/20";
        icon = "warning";
    } else if (s === 'low' || s === 'info') {
        styles = "bg-blue-500/10 text-blue-500 border-blue-500/20";
        icon = "info";
    }

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-black uppercase rounded-lg shadow-sm ${styles}`}>
            <span className="material-symbols-outlined text-[14px]">{icon}</span>
            {severity}
        </span>
    );
};

const StatusBadge: React.FC<{ status: string; isRead?: boolean }> = ({ status, isRead }) => {
    const s = (status || '').toLowerCase();
    const isActive = s === 'active';

    return (
        <span className={`flex items-center gap-2 text-[10px] font-black uppercase ${isActive ? 'text-rose-500' : 'text-slate-400'}`}>
            <span className={`relative flex h-2 w-2`}>
                {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
            </span>
            {status}
            {isRead === false && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary rounded-md text-[8px]">NEW</span>
            )}
        </span>
    );
};

// --- Main Component ---

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
    const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
    const [ruleSearchTerm, setRuleSearchTerm] = useState("");
    const [rulePriorityFilter, setRulePriorityFilter] = useState("All");
    const [ruleHubFilter, setRuleHubFilter] = useState<number>(0);
    const [allHubs, setAllHubs] = useState<Hub[]>([]);
    const [ruleTotalCount, setRuleTotalCount] = useState(0);
    const [ruleCurrentPage, setRuleCurrentPage] = useState(1);
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
    const totalPages = activeTab === 'history' 
        ? Math.ceil(totalCount / pageSize) 
        : Math.ceil(ruleTotalCount / pageSize);
    
    // Stats for UI
    const unreadCount = alerts.filter(a => !a.isRead).length;
    const criticalCount = alerts.filter(a => a.severity.toLowerCase() === 'high' || a.severity.toLowerCase() === 'critical').length;

    // --- API Calls ---

    const fetchAlerts = useCallback(async (silent = false) => {
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
    }, [currentPage, pageSize, selectedSiteId, selectedHubId, selectedSeverity, dateFrom, dateTo, historySortBy, historySortOrder]);

    const fetchRules = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError(null);
        try {
            const response = await alertService.getRules({
                search: ruleSearchTerm || undefined,
                priority: rulePriorityFilter !== 'All' ? rulePriorityFilter : undefined,
                hubId: ruleHubFilter !== 0 ? ruleHubFilter : undefined,
                pageNumber: ruleCurrentPage,
                pageSize: pageSize,
                sortBy: ruleSortBy,
                sortOrder: ruleSortOrder,
            });
            setRules(response.data);
            setRuleTotalCount(response.totalCount);
        } catch (error) {
            console.error("Failed to fetch rules", error);
            setError('Failed to load alert rules.');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [ruleSearchTerm, rulePriorityFilter, ruleHubFilter, ruleSortBy, ruleSortOrder, ruleCurrentPage, pageSize]);

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

    const fetchAllHubs = async () => {
        try {
            const data = await hubService.getAll();
            setAllHubs(data);
        } catch (error) {
            console.error("Failed to fetch all hubs", error);
        }
    };

    // --- Effects ---

    useEffect(() => {
        if (selectedSiteId > 0) {
            fetchHubsForSite(selectedSiteId);
        } else {
            setHubs([]);
            setSelectedHubId(0);
        }
    }, [selectedSiteId]);

    useEffect(() => {
        signalRService.startConnection();
        fetchSites();
        fetchAllHubs();
        if (activeTab === 'history') {
            fetchAlerts();
        } else {
            fetchRules();
            fetchSensors();
        }
    }, [activeTab, fetchAlerts, fetchRules]);

    // Rule search debounce
    useEffect(() => {
        if (activeTab !== 'rules') return;
        clearTimeout(ruleSearchDebounce.current);
        ruleSearchDebounce.current = setTimeout(() => {
            fetchRules();
        }, 400);
        return () => clearTimeout(ruleSearchDebounce.current);
    }, [fetchRules, activeTab, ruleSearchTerm]);

    // Real-time SignalR
    useEffect(() => {
        const handleRealtimeUpdate = (data: any) => {
            console.log("AlertsPage: SignalR update received", data);
            if (activeTab === 'history') {
                if (data && typeof data === 'object' && data.id) {
                    setAlerts(prev => {
                        if (prev.find(a => a.id === data.id)) return prev;
                        const updated = [data, ...prev];
                        return updated.slice(0, pageSize);
                    });
                    setTotalCount(prev => prev + 1);
                } else {
                    fetchAlerts(true);
                }
            } else {
                fetchRules();
            }
        };

        signalRService.on("ReceiveAlertNotification", handleRealtimeUpdate);
        signalRService.on("receivealertnotification", handleRealtimeUpdate);
        return () => {
            signalRService.off("ReceiveAlertNotification", handleRealtimeUpdate);
            signalRService.off("receivealertnotification", handleRealtimeUpdate);
        };
    }, [activeTab, pageSize, fetchAlerts, fetchRules]);

    // --- Handlers ---

    const confirmResolve = async () => {
        if (!resolveConfirmId) return;
        try {
            const response = await alertService.resolve(resolveConfirmId);
            setAlerts(alerts.map(a => a.id === resolveConfirmId ? { ...a, status: 'Resolved' } : a));
            showNotification(response.message || "Resolved successful!", 'success');
        } catch (error: any) {
            showNotification('Failed to resolve: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setResolveConfirmId(null);
        }
    };

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

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
            showNotification("Marked as read", 'success');
        } catch (error) {
            showNotification("Failed to mark read", 'error');
        }
    };

    const handleDeleteAlert = (id: number) => setAlertToDelete(id);

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleFormData.name || ruleFormData.sensorId === 0) {
            showNotification('Please fill required fields', 'error');
            return;
        }

        setIsSubmittingRule(true);
        try {
            if (editingRuleId) {
                await alertService.updateRule(editingRuleId, ruleFormData);
                showNotification('Rule updated!', 'success');
            } else {
                await alertService.createRule(ruleFormData);
                showNotification('Rule created!', 'success');
            }
            setIsRuleModalOpen(false);
            fetchRules();
        } catch (error: any) {
            showNotification('Operation failed: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setIsSubmittingRule(false);
        }
    };

    const filteredAlerts = useMemo(() => {
        return alerts.filter(a => 
            !searchTerm || 
            a.sensorName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            a.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [alerts, searchTerm]);

    return (
        <Layout title="Alert Management" breadcrumb="Security & Health">
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* --- HEADER SUMMARY --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Logs" 
                        value={totalCount} 
                        icon="database" 
                        color="bg-primary" 
                        trend="+12%" 
                    />
                    <StatCard 
                        title="Unread Alerts" 
                        value={unreadCount} 
                        icon="notifications_active" 
                        color="bg-amber-500" 
                        trend={unreadCount > 5 ? "+New" : ""} 
                    />
                    <StatCard 
                        title="Critical Errors" 
                        value={criticalCount} 
                        icon="emergency" 
                        color="bg-rose-500" 
                    />
                    <StatCard 
                        title="Active Rules" 
                        value={rules.filter(r => r.isActive).length} 
                        icon="shield_with_heart" 
                        color="bg-emerald-500" 
                    />
                </div>

                {/* --- NAVIGATION & TACTION BAR --- */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200 dark:border-border-muted shadow-sm w-fit glassmorphism">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === 'history'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">history</span>
                            Alert History
                        </button>
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === 'rules'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">settings_alert</span>
                            Security Rules
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab === 'rules' && canManage && (
                           <button
                               onClick={() => { setIsRuleModalOpen(true); setEditingRuleId(null); setRuleFormData({ sensorId: 0, name: '', conditionType: 'MinMax', minVal: 0, maxVal: 100, notificationMethod: 'Email', priority: 'Warning' }); }}
                               className="px-6 py-3 bg-slate-900 dark:bg-primary text-white dark:text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
                           >
                               <span className="material-symbols-outlined text-sm font-bold group-hover:rotate-90 transition-transform">add</span>
                               New Security Rule
                           </button>
                        )}
                        <button
                            onClick={() => activeTab === 'history' ? fetchAlerts() : fetchRules()}
                            className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-2xl text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all group shadow-sm"
                        >
                            <span className={`material-symbols-outlined text-sm block transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`}>refresh</span>
                        </button>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-border-muted overflow-hidden relative shadow-2xl transition-all duration-500 group-hover:border-primary/20 min-h-[500px]">
                    
                    {/* Background Glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-1 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] -z-1 pointer-events-none"></div>

                    {/* Filter Toolbars */}
                    <div className="p-6 border-b border-slate-200 dark:border-border-muted bg-slate-50/20 dark:bg-white/[0.02] backdrop-blur-sm">
                        {activeTab === 'history' ? (
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="relative flex-1 min-w-[300px] group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search by sensor, message or location..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="w-full bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-border-muted rounded-[1.25rem] pl-12 pr-5 py-3.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                                    />
                                </div>
                                
                                <select
                                    value={selectedSiteId}
                                    onChange={(e) => setSelectedSiteId(Number(e.target.value))}
                                    className="bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-border-muted rounded-[1.25rem] px-5 py-3.5 text-[11px] font-black uppercase text-slate-800 dark:text-zinc-300 min-w-[160px] outline-none hover:border-primary/40 focus:border-primary/60 transition-all appearance-none cursor-pointer text-center"
                                >
                                    <option value="0">Global Sites</option>
                                    {sites.map(s => <option key={s.siteId} value={s.siteId}>{s.name}</option>)}
                                </select>

                                <select
                                    disabled={selectedSiteId === 0}
                                    value={selectedHubId}
                                    onChange={(e) => setSelectedHubId(Number(e.target.value))}
                                    className="bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-border-muted rounded-[1.25rem] px-5 py-3.5 text-[11px] font-black uppercase text-slate-800 dark:text-zinc-300 min-w-[140px] outline-none disabled:opacity-30 disabled:grayscale transition-all appearance-none cursor-pointer text-center"
                                >
                                    <option value="0">All Hubs</option>
                                    {hubs.map(h => <option key={h.hubId} value={h.hubId}>{h.name}</option>)}
                                </select>

                                <select
                                    value={selectedSeverity}
                                    onChange={(e) => setSelectedSeverity(e.target.value)}
                                    className="bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-border-muted rounded-[1.25rem] px-5 py-3.5 text-[11px] font-black uppercase text-slate-800 dark:text-zinc-300 min-w-[140px] outline-none transition-all appearance-none cursor-pointer text-center"
                                >
                                    <option value="">Any Severity</option>
                                    <option value="High">Critical</option>
                                    <option value="Medium">Warning</option>
                                    <option value="Low">Informational</option>
                                </select>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="relative flex-1 min-w-[300px] group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">travel_explore</span>
                                    <input
                                        type="text"
                                        placeholder="Filter rules by name or sensor ID..."
                                        value={ruleSearchTerm}
                                        onChange={(e) => setRuleSearchTerm(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-border-muted rounded-[1.25rem] pl-12 pr-5 py-3.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                                    />
                                </div>
                                <select
                                    value={rulePriorityFilter}
                                    onChange={(e) => setRulePriorityFilter(e.target.value)}
                                    className="bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-border-muted rounded-[1.25rem] px-8 py-3.5 text-[11px] font-black uppercase text-slate-800 dark:text-zinc-300 min-w-[150px] appearance-none cursor-pointer outline-none text-center"
                                >
                                    <option value="All">All Priorities</option>
                                    <option value="High">Priority: High</option>
                                    <option value="Medium">Priority: Medium</option>
                                    <option value="Low">Priority: Low</option>
                                </select>

                                <select
                                    value={ruleHubFilter}
                                    onChange={(e) => setRuleHubFilter(Number(e.target.value))}
                                    className="bg-white dark:bg-zinc-950/50 border border-slate-200 dark:border-border-muted rounded-[1.25rem] px-8 py-3.5 text-[11px] font-black uppercase text-slate-800 dark:text-zinc-300 min-w-[150px] appearance-none cursor-pointer outline-none text-center"
                                >
                                    <option value={0}>All Hubs</option>
                                    {allHubs.map(h => (
                                        <option key={h.hubId} value={h.hubId}>{h.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Content Table */}
                    <div className="overflow-x-auto custom-scrollbar relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative flex h-12 w-12">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative rounded-full h-12 w-12 bg-primary flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white animate-spin">refresh</span>
                                        </span>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Syncing...</span>
                                </div>
                            </div>
                        )}

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-black/20 text-slate-400 dark:text-zinc-500">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em]">Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em]">Origin</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em]">Condition</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em]">Impact</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em]">Timeline / Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.15em]">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                                {activeTab === 'history' ? (
                                    filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
                                        <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-primary/[0.02] transition-colors group/row">
                                            <td className="px-8 py-6 max-w-sm">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover/row:text-primary transition-colors leading-tight">{alert.message}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log ID: #{alert.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-sm text-primary">sensors</span>
                                                        <span className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase">{alert.sensorName}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 ml-5">{alert.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-mono text-xs text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded font-bold text-primary">{alert.value}{alert.metricUnit}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <SeverityBadge severity={alert.severity} />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-2">
                                                    <StatusBadge status={alert.status} isRead={alert.isRead} />
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                        {new Date(alert.time).toLocaleString('vi-VN', { 
                                                            day:'2-digit', month:'2-digit', year:'numeric', 
                                                            hour:'2-digit', minute:'2-digit' 
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 translate-x-4 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all duration-300">
                                                    {!alert.isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(alert.id)}
                                                            className="p-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                            title="Maked as Read"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">done_all</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteAlert(alert.id)}
                                                        className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                        title="Delete Log"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={6} className="p-20 text-center text-slate-500 dark:text-zinc-600 font-bold uppercase tracking-[0.3em] text-[10px]">Registry Empty</td></tr>
                                    )
                                ) : (
                                    rules.length > 0 ? rules.map((rule) => (
                                        <tr key={rule.ruleId} className="hover:bg-slate-50 dark:hover:bg-primary/[0.02] transition-colors group/row">
                                            <td className="px-8 py-7">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                        <span className="material-symbols-outlined">rule</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{rule.name}</span>
                                                        <p className="text-[10px] text-slate-500 font-bold">MODE: {rule.conditionType}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">ID: {rule.sensorId}</span>
                                                    <span className="text-[10px] text-primary font-black uppercase">{rule.sensorName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                 <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-black">
                                                        {rule.minVal} → {rule.maxVal}
                                                    </span>
                                                 </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <SeverityBadge severity={rule.priority} />
                                            </td>
                                            <td className="px-8 py-7">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${rule.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-500'}`}>
                                                    <span className={`w-1 h-1 rounded-full ${rule.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                                    {rule.isActive ? 'Active' : 'Disabled'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 text-right">
                                                <button
                                                    onClick={() => { setEditingRuleId(rule.ruleId); setRuleFormData({ sensorId: rule.sensorId, name: rule.name, conditionType: rule.conditionType, minVal: rule.minVal, maxVal: rule.maxVal, notificationMethod: rule.notificationMethod, priority: rule.priority }); setIsRuleModalOpen(true); }}
                                                    className="p-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={6} className="p-20 text-center text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">No Rules Defined</td></tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-8 bg-slate-50/50 dark:bg-black/20 border-t border-slate-200 dark:border-border-muted flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                Page {activeTab === 'history' ? currentPage : ruleCurrentPage} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    disabled={(activeTab === 'history' ? currentPage : ruleCurrentPage) === 1} 
                                    onClick={() => activeTab === 'history' ? setCurrentPage(p => p - 1) : setRuleCurrentPage(p => p - 1)} 
                                    className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-xl disabled:opacity-20 hover:border-primary/50 transition-all shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                <button 
                                    disabled={(activeTab === 'history' ? currentPage : ruleCurrentPage) === totalPages} 
                                    onClick={() => activeTab === 'history' ? setCurrentPage(p => p + 1) : setRuleCurrentPage(p => p + 1)} 
                                    className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-xl disabled:opacity-20 hover:border-primary/50 transition-all shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Delete Confirmation */}
            <Modal isOpen={alertToDelete !== null} onClose={() => setAlertToDelete(null)} title="Destructive Action">
                <div className="p-8">
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                        <span className="material-symbols-outlined text-3xl">delete_forever</span>
                    </div>
                    <h4 className="text-lg font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Confirm Registry Deletion</h4>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 text-center mb-8 px-4">This log entry will be permanently removed from the security archives. This operation cannot be reversed.</p>
                    <div className="flex gap-4">
                        <button onClick={() => setAlertToDelete(null)} className="flex-1 py-4 px-6 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Abort</button>
                        <button onClick={confirmDeleteAlert} className="flex-1 py-4 px-6 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-500/30 transition-all">Proceed</button>
                    </div>
                </div>
            </Modal>

            {/* Create/Edit Rule Modal */}
            <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title={editingRuleId ? "Update Security Protocol" : "Authorize New Alert Rule"}>
                <form onSubmit={handleCreateRule} className="p-10 space-y-8 max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Rule Configuration Name</label>
                            <input
                                required
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                placeholder="e.g. AMBIENT_TEMP_CRITICAL"
                                value={ruleFormData.name}
                                onChange={e => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                            />
                        </div>

                        {!editingRuleId && (
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Target hardware Node</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary outline-none appearance-none"
                                    value={ruleFormData.sensorId}
                                    onChange={e => setRuleFormData({ ...ruleFormData, sensorId: Number(e.target.value) })}
                                >
                                    <option value={0}>-- Select Sensor Source --</option>
                                    {sensors.map(s => (
                                        <option key={s.sensorId} value={s.sensorId}>{s.sensorName} ({s.hubName})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Lower Threshold</label>
                            <input type="number" step="0.1"
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary outline-none"
                                value={ruleFormData.minVal}
                                onChange={e => setRuleFormData({ ...ruleFormData, minVal: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Upper Threshold</label>
                            <input type="number" step="0.1"
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary outline-none"
                                value={ruleFormData.maxVal}
                                onChange={e => setRuleFormData({ ...ruleFormData, maxVal: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Condition Logic</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary outline-none"
                                value={ruleFormData.conditionType}
                                onChange={e => setRuleFormData({ ...ruleFormData, conditionType: e.target.value })}
                            >
                                <option value="MinMax">Inside Range [Min-Max]</option>
                                <option value="Outside">Outside Range</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Priority Escalation</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary outline-none"
                                value={ruleFormData.priority}
                                onChange={e => setRuleFormData({ ...ruleFormData, priority: e.target.value })}
                            >
                                <option value="Low">Low (Informational)</option>
                                <option value="Medium">Medium (Warning)</option>
                                <option value="High">High (Critical)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-zinc-800 flex gap-4">
                         <button type="button" onClick={() => setIsRuleModalOpen(false)} className="flex-1 py-4 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
                         <button 
                            type="submit" 
                            disabled={isSubmittingRule}
                            className="flex-1 py-4 bg-primary text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {isSubmittingRule ? 'Processing...' : (editingRuleId ? 'Commit Changes' : 'Authorize Rule')}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default AlertsPage;
