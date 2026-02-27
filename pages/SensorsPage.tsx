
import React, { useState, useEffect, useRef } from 'react';
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
  const [filterTypeId, setFilterTypeId] = useState<number | undefined>();
  const [filterHubId, setFilterHubId] = useState<number | undefined>();
  const [filterSiteId, setFilterSiteId] = useState<number | undefined>();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;


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

  // Fetch hubs and setup SignalR on mount
  useEffect(() => {
    fetchHubs();
    if (hasRole(['ADMIN'])) {
      fetchSites();
    }
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

      // Debounce 2s: handle rapid OFF→ON→OFF changes
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

  // Fetch sensors when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchSensors();
  }, [filterTypeId, filterHubId, filterSiteId]);

  /**
   * Hàm gọi API để lấy danh sách sensors
   * Sử dụng sensorService.getAll() với các tham số filter
   */
  /**
   * Hàm gọi API để lấy danh sách sensors
   * Sử dụng sensorService.getAll() với các tham số filter
   */
  const fetchSensors = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      let data = await sensorService.getAll(filterHubId, filterTypeId, filterSiteId);

      // Frontend fallback: Nếu đã chọn lọc Site, ta lọc lại dữ liệu trả về 
      // dựa trên thông tin Site của Hub mà Sensor đó thuộc về.
      if (filterSiteId) {
        // Lấy danh sách ID của các Hub thuộc Site đang chọn
        const hubIdsInSite = hubs
          .filter(hub => hub.siteId === filterSiteId)
          .map(hub => hub.hubId);

        // Lọc lại danh sách sensor
        data = data.filter(sensor => hubIdsInSite.includes(sensor.hubId));
      }

      setSensors(data);
    } catch (error) {
      console.error("Failed to fetch sensors", error);
      setError('Không thể tải dữ liệu sensors. Vui lòng kiểm tra kết nối.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  /**
   * Hàm gọi API để lấy danh sách hubs
   */
  const fetchHubs = async () => {
    try {
      const data = await hubService.getAll();
      setHubs(data);
    } catch (error) {
      console.error("Failed to fetch hubs", error);
    }
  };

  /**
   * Hàm gọi API để lấy danh sách sites (chỉ cho Admin)
   */
  const fetchSites = async () => {
    try {
      const data = await siteService.getAll();
      setSites(data);
    } catch (error) {
      console.error("Failed to fetch sites", error);
    }
  };

  /**
   * Hàm xử lý tạo hoặc cập nhật sensor
   */
  const handleSaveSensor = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
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
        // Cập nhật sensor
        await sensorService.update(editingSensorId, {
          name: formData.name,
          typeId: formData.typeId,
          hubId: formData.hubId
        });
        showNotification('Cập nhật sensor thành công!', 'success');
      } else {
        // Tạo sensor mới
        await sensorService.create(formData);
        showNotification('Tạo sensor thành công!', 'success');
      }

      // Reset form & state
      setFormData({
        name: '',
        typeId: 1,
        hubId: 0
      });
      setEditingSensorId(null);

      // Đóng modal và refresh danh sách
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

  /**
   * Hàm xử lý xóa sensor
   */
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

  /**
   * Hàm mở modal tạo sensor mới
   */
  const handleOpenCreateModal = () => {
    setEditingSensorId(null);
    setFormData({
      name: '',
      typeId: 1,
      hubId: hubs.length > 0 ? hubs[0].hubId : 0
    });
    setIsModalOpen(true);
  };

  /**
   * Hàm mở modal chỉnh sửa sensor
   */
  const handleOpenEditModal = (sensor: Sensor) => {
    setEditingSensorId(sensor.sensorId);
    setFormData({
      name: sensor.sensorName,
      typeId: sensor.typeId,
      hubId: sensor.hubId
    });
    setIsModalOpen(true);
  };



  /**
   * Hàm helper để xác định màu sắc dựa trên status
   */
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
        return 'text-emerald-500';
      case 'offline':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-slate-500';
    }
  };

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

      {/* Stats Quick View (Optional decorative/functional) */}
      <div className="grid grid-cols-4 gap-4 mb-6">
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
        {/* Filter Section */}
        <div className="p-4 border-b border-slate-200 dark:border-border-muted flex gap-4 items-center justify-between bg-slate-50 dark:bg-zinc-900/30">
          <div className="flex gap-3">
            {hasRole(['ADMIN']) && (
              <select
                value={filterSiteId || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setFilterSiteId(val);
                  setFilterHubId(undefined); // Reset hub when site changes
                }}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary appearance-none transition-colors"
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.siteId} value={site.siteId}>{site.name}</option>
                ))}
              </select>
            )}
            <select
              value={filterTypeId || ''}
              onChange={(e) => setFilterTypeId(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary appearance-none transition-colors"
            >
              <option value="">All Types</option>
              <option value="1">Temperature</option>
              <option value="2">Humidity</option>
              <option value="3">Pressure</option>
            </select>
            <button
              onClick={() => fetchSensors()}
              className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-border-muted rounded-lg text-xs font-bold text-slate-700 dark:text-white flex items-center gap-2 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </button>
          </div>
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
          /* Error State */
          <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg m-4 border border-red-500/20">
            <p className="font-bold">Lỗi khi tải dữ liệu</p>
            <p className="text-sm opacity-80 mt-1">{error}</p>
            <button
              onClick={fetchSensors}
              className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          /* Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Sensor ID</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Sensor Name</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Type</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Hub</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Status</th>
                  {canManage && <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-muted">
                {sensors
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((sensor) => (
                    <tr key={sensor.sensorId} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">{sensor.sensorId}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{sensor.sensorName}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{sensor.typeName}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{sensor.hubName}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase ${getStatusColor(sensor.status)}`}>
                          {sensor.status}
                        </span>
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
                {sensors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Không tìm thấy sensor nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && sensors.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-border-muted bg-slate-50/50 dark:bg-zinc-900/10 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, sensors.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{sensors.length}</span> sensors
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-border-muted rounded-lg text-xs font-bold text-slate-700 dark:text-white disabled:opacity-30 transition-all hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(sensors.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-slate-900 dark:bg-white text-white dark:text-black scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(sensors.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(sensors.length / itemsPerPage)}
                className="px-3 py-1.5 border border-slate-200 dark:border-border-muted rounded-lg text-xs font-bold text-slate-700 dark:text-white disabled:opacity-30 transition-all hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Next
              </button>
            </div>
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
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg px-4 py-2.5 text-sm text-slate-910 dark:text-white focus:ring-1 focus:ring-primary outline-none transition-colors"
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
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg p-2.5 text-xs text-slate-910 dark:text-white focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none"
                required
              >
                <option value="0">Select Hub</option>
                {hubs.map(hub => (
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
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-lg p-2.5 text-xs text-slate-910 dark:text-white focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none"
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
    </Layout >
  );
};

export default SensorsPage;
