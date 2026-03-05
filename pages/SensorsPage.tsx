
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

import { sensorService, Sensor, CreateSensorRequest } from '../services/sensorService';
import { hubService, Hub } from '../services/hubService';
import { siteService, Site } from '../services/siteService';
import { signalRService } from '../services/signalrService';


const SensorsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showNotification } = useNotification();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);

  // Server-side filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypeId, setFilterTypeId] = useState<number | undefined>();
  const [filterHubId, setFilterHubId] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<'sensorId' | 'name' | 'status' | 'hubId' | 'type'>('sensorId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  // Form state cho tạo sensor mới
  const [formData, setFormData] = useState<CreateSensorRequest>({
    name: '',
    typeId: 1,
    hubId: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSensorId, setEditingSensorId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Debounce ref for sensor status to handle OFF→ON→OFF bounce
  const sensorStatusTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Fetch sensors với đầy đủ params
  const fetchSensors = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await sensorService.getAll({
        search: searchTerm || undefined,
        hub_id: filterHubId,
        type: filterTypeId,
        status: filterStatus || undefined,
        sortBy,
        sortOrder,
      });
      setSensors(data);
    } catch (error) {
      console.error("Failed to fetch sensors", error);
      setError('Không thể tải dữ liệu sensors. Vui lòng kiểm tra kết nối.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [searchTerm, filterHubId, filterTypeId, filterStatus, sortBy, sortOrder]);

  // Fetch hubs and setup SignalR on mount
  useEffect(() => {
    fetchHubs();
    fetchSites();
    signalRService.startConnection();

    // Listener for sensor updates (generic)
    const handleSensorUpdate = (updatedSensor: Sensor) => {
      console.log("Realtime sensor update received:", updatedSensor);
      setSensors(prevSensors =>
        prevSensors.map(sensor =>
          sensor.sensorId === updatedSensor.sensorId ? { ...sensor, ...updatedSensor } : sensor
        )
      );
    };

    // Listener for sensor status changes (Online/Offline) with 2s debounce
    const handleSensorStatusChange = (data: any) => {
      console.log("Realtime sensor status change received:", data);
      const sensorId = data?.sensorId || data?.SensorId;
      const status = data?.status || (data?.isOnline ? 'Online' : 'Offline');

      clearTimeout(sensorStatusTimeouts.current[sensorId]);
      sensorStatusTimeouts.current[sensorId] = setTimeout(() => {
        setSensors(prevSensors =>
          prevSensors.map(sensor =>
            sensor.sensorId === sensorId ? { ...sensor, status } : sensor
          )
        );
      }, 2000);
    };

    signalRService.on("ReceiveSensorUpdate", handleSensorUpdate);
    signalRService.on("ReceiveSensorStatusChange", handleSensorStatusChange);
    signalRService.on("receivesensorstatuschange", handleSensorStatusChange);

    return () => {
      Object.values(sensorStatusTimeouts.current).forEach(clearTimeout);
      signalRService.off("ReceiveSensorUpdate", handleSensorUpdate);
      signalRService.off("ReceiveSensorStatusChange", handleSensorStatusChange);
      signalRService.off("receivesensorstatuschange", handleSensorStatusChange);
    };
  }, []);

  // Re-fetch khi filter/sort thay đổi (debounce cho search)
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchSensors();
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [fetchSensors]);

  const fetchHubs = async () => {
    try {
      const data = await hubService.getAll();
      setHubs(data);
    } catch (error) {
      console.error("Failed to fetch hubs", error);
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

  const handleSaveSensor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showNotification('Vui lòng nhập tên sensor', 'warning');
      return;
    }
    if (formData.hubId === 0) {
      showNotification('Vui lòng chọn Hub', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSensorId) {
        await sensorService.update(editingSensorId, {
          name: formData.name,
          typeId: formData.typeId,
          hubId: formData.hubId
        });
        showNotification('Cập nhật sensor thành công!', 'success');
      } else {
        await sensorService.create(formData);
        showNotification('Tạo sensor thành công!', 'success');
      }

      setFormData({ name: '', typeId: 1, hubId: 0 });
      setEditingSensorId(null);
      setIsModalOpen(false);
      fetchSensors();

    } catch (error: any) {
      console.error("Failed to save sensor", error);
      const errorMsg = error.response?.data?.message || error.message || 'Không thể lưu sensor';
      showNotification(`Lỗi: ${errorMsg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteSensor = async () => {
    if (!deleteTargetId) return;

    try {
      await sensorService.delete(deleteTargetId);
      showNotification('Xóa sensor thành công!', 'success');
      setSensors(sensors.filter(s => s.sensorId !== deleteTargetId));
    } catch (error: any) {
      console.error("Failed to delete sensor", error);
      showNotification('Lỗi khi xóa sensor: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingSensorId(null);
    setFormData({
      name: '',
      typeId: 1,
      hubId: hubs.length > 0 ? hubs[0].hubId : 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sensor: Sensor) => {
    setEditingSensorId(sensor.sensorId);
    setFormData({
      name: sensor.sensorName,
      typeId: sensor.typeId,
      hubId: sensor.hubId
    });
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return 'text-emerald-500';
      case 'offline': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return 'bg-emerald-500 animate-pulse';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500 animate-pulse';
      default: return 'bg-slate-400';
    }
  };

  // Filtered hubs based on sites selection for modal
  const hubsForForm = hubs;

  return (
    <Layout title="Sensors Management" breadcrumb="Environment Overview">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">IoT Sensors Management</h3>
          <p className="text-slate-500 text-sm mt-1">Inventory and real-time status of environmental sensors.</p>
        </div>
        {canManage && (
          <button onClick={handleOpenCreateModal} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-slate-200 transition-all rounded shadow-lg shadow-slate-900/10 dark:shadow-none text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Register Sensor
          </button>
        )}
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-border-muted shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">sensors</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sensors</p>
            <p className="text-xl font-bold dark:text-white">{sensors.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-border-muted shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online</p>
            <p className="text-xl font-bold dark:text-white">{sensors.filter(s => s.status.toLowerCase() === 'online').length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-border-muted shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-xl">error</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offline</p>
            <p className="text-xl font-bold dark:text-white">{sensors.filter(s => s.status.toLowerCase() !== 'online').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-border-muted overflow-hidden transition-colors shadow-sm mb-6">
        {/* Filter / Search Section */}
        <div className="p-4 border-b border-slate-200 dark:border-border-muted flex flex-wrap gap-3 items-center bg-slate-50 dark:bg-zinc-900/30">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Search sensor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          </div>

          {/* Filter Hub */}
          <select
            value={filterHubId || ''}
            onChange={(e) => setFilterHubId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="">All Hubs</option>
            {hubs.map(hub => (
              <option key={hub.hubId} value={hub.hubId}>{hub.name}</option>
            ))}
          </select>

          {/* Filter Type */}
          <select
            value={filterTypeId || ''}
            onChange={(e) => setFilterTypeId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="">All Types</option>
            <option value="1">Temperature</option>
            <option value="2">Humidity</option>
            <option value="3">Pressure</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="">All Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Warning">Warning</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="sensorId">Default</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="hubId">Hub</option>
            <option value="type">Type</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none transition-all flex items-center gap-1"
            title="Toggle sort order"
          >
            <span className="material-symbols-outlined text-sm">
              {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
            {sortOrder.toUpperCase()}
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchSensors()}
            className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-border-muted rounded-lg text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p>Đang tải dữ liệu sensors...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg m-4 border border-red-500/20">
            <p className="font-bold">Lỗi khi tải dữ liệu</p>
            <p className="text-sm opacity-80 mt-1">{error}</p>
            <button
              onClick={() => fetchSensors()}
              className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Sensor Name</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Type</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Hub</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Status</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Last Update</th>
                  {canManage && <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-muted">
                {sensors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Không tìm thấy sensor nào.
                    </td>
                  </tr>
                ) : sensors.map((sensor) => (
                  <tr key={sensor.sensorId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{sensor.sensorName}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{sensor.typeName}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{sensor.hubName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase ${getStatusColor(sensor.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(sensor.status)}`} />
                        {sensor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">
                      {sensor.lastUpdate ? new Date(sensor.lastUpdate).toLocaleString() : '—'}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(sensor)}
                          className="text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(sensor.sensorId)}
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
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSensorId(null); }} title={editingSensorId ? "Edit Sensor" : "Register Sensor"}>
        <form onSubmit={handleSaveSensor} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Sensor Name *
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="e.g. Temp-Sensor-01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Hub *
              </label>
              <select
                value={formData.hubId}
                onChange={(e) => setFormData({ ...formData, hubId: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none"
                required
              >
                <option value="0">Select Hub</option>
                {hubsForForm.map(hub => (
                  <option key={hub.hubId} value={hub.hubId} className="bg-white text-slate-900">
                    {hub.name} ({hub.siteName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Type *
              </label>
              <select
                value={formData.typeId}
                onChange={(e) => setFormData({ ...formData, typeId: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none"
                required
              >
                <option value="1">Temperature</option>
                <option value="2">Humidity</option>
                <option value="3">Pressure</option>
              </select>
            </div>
          </div>

          {hubs.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-500 text-xs">
                ⚠️ Không có Hub nào. Vui lòng tạo Hub trước khi tạo Sensor.
              </p>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setEditingSensorId(null); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold uppercase shadow-lg shadow-slate-900/10 dark:shadow-none hover:bg-black dark:hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || hubs.length === 0}
            >
              {isSubmitting ? (editingSensorId ? 'Saving...' : 'Creating...') : (editingSensorId ? 'Save Changes' : 'Register')}
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
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Delete Sensor?</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Are you sure you want to delete this sensor? This action cannot be undone.
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
              onClick={confirmDeleteSensor}
              className="flex-1 px-6 py-2.5 bg-red-500 text-white rounded-lg text-xs font-bold uppercase hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default SensorsPage;
