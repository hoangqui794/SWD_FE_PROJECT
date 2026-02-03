
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

import { sensorService, Sensor, CreateSensorRequest } from '../services/sensorService';
import { hubService, Hub } from '../services/hubService';
import { signalRService } from '../services/signalrService';


const SensorsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'MANAGER']);

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTypeId, setFilterTypeId] = useState<number | undefined>();
  const [filterHubId, setFilterHubId] = useState<number | undefined>();

  // Form state cho tạo sensor mới
  const [formData, setFormData] = useState<CreateSensorRequest>({
    name: '',
    typeId: 1,
    hubId: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch sensors và hubs khi component mount
  useEffect(() => {
    fetchSensors();
    fetchHubs();

    // SignalR Integration
    signalRService.startConnection();

    const handleSensorUpdate = (data: any) => {
      console.log("Realtime sensor update received:", data);
      fetchSensors(false); // Silent refresh
    };

    signalRService.on("ReceiveSensorUpdate", handleSensorUpdate);

    return () => {
      signalRService.off("ReceiveSensorUpdate", handleSensorUpdate);
    };
  }, [filterTypeId, filterHubId]);

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
      const data = await sensorService.getAll(filterHubId, filterTypeId);
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
   * Hàm xử lý tạo sensor mới
   */
  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sensor');
      return;
    }
    if (formData.hubId === 0) {
      alert('Vui lòng chọn Hub');
      return;
    }

    setIsSubmitting(true);
    try {
      await sensorService.create(formData);

      // Reset form
      setFormData({
        name: '',
        typeId: 1,
        hubId: 0
      });

      // Đóng modal và refresh danh sách
      setIsModalOpen(false);
      fetchSensors();

      alert('Tạo sensor thành công!');
    } catch (error: any) {
      console.error("Failed to create sensor", error);
      const errorMsg = error.response?.data?.message || error.message || 'Không thể tạo sensor';
      alert(`Lỗi: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Hàm mở modal tạo sensor mới
   */
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      typeId: 1,
      hubId: hubs.length > 0 ? hubs[0].hubId : 0
    });
    setIsModalOpen(true);
  };

  /**
   * Hàm helper để hiển thị giá trị sensor với đơn vị
   */
  const formatSensorValue = (sensor: Sensor) => {
    const value = sensor.currentValue;

    // Xác định đơn vị dựa trên typeName
    let unit = '';
    switch (sensor.typeName) {
      case 'Temperature':
        unit = '°C';
        break;
      case 'Humidity':
        unit = '%';
        break;
      case 'Pressure':
        unit = 'hPa';
        break;
      default:
        unit = '';
    }

    return `${value.toFixed(2)} ${unit}`;
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
          <h3 className="text-2xl font-bold tracking-tight">IoT Sensors Management</h3>
          <p className="text-slate-500 text-sm mt-1">Inventory and real-time status of environmental sensors.</p>
        </div>
        {canManage && (
          <button onClick={handleOpenCreateModal} className="px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-colors rounded text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Register Sensor
          </button>
        )}
      </div>
      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden">
        {/* Filter Section */}
        <div className="p-4 border-b border-border-muted flex gap-4 items-center justify-between bg-zinc-900/30">
          <div className="flex gap-3">
            <select
              value={filterTypeId || ''}
              onChange={(e) => setFilterTypeId(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-zinc-900 border border-border-muted rounded px-4 py-2 text-xs text-white"
            >
              <option value="">All Types</option>
              <option value="1">Temperature</option>
              <option value="2">Humidity</option>
              <option value="3">Pressure</option>
            </select>
            <button
              onClick={fetchSensors}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-border-muted rounded text-xs font-bold text-white flex items-center gap-2"
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
              <thead className="bg-zinc-900/50 border-b border-border-muted">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {sensors.map((sensor) => (
                  <tr key={sensor.sensorId} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white whitespace-nowrap">{sensor.sensorId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{sensor.sensorName}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{sensor.typeName}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{sensor.hubName}</td>
                    <td className={`px-6 py-4 font-bold ${getStatusColor(sensor.status)}`}>
                      {formatSensorValue(sensor)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase ${getStatusColor(sensor.status)}`}>
                        {sensor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {sensor.lastUpdate ? new Date(sensor.lastUpdate).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                  </tr>
                ))}
                {sensors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Không tìm thấy sensor nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Sensor">
        <form onSubmit={handleCreateSensor} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Sensor Name *
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-border-muted rounded px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
              placeholder="e.g. Temp-Sensor-01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Hub *
              </label>
              <select
                value={formData.hubId}
                onChange={(e) => setFormData({ ...formData, hubId: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-border-muted rounded p-2.5 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                required
              >
                <option value="0">Select Hub</option>
                {hubs.map(hub => (
                  <option key={hub.hubId} value={hub.hubId}>
                    {hub.name} ({hub.siteName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Type *
              </label>
              <select
                value={formData.typeId}
                onChange={(e) => setFormData({ ...formData, typeId: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-border-muted rounded p-2.5 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
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
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-border-muted text-white rounded text-xs font-bold uppercase hover:bg-white/5 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded text-xs font-bold uppercase hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || hubs.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout >
  );
};

export default SensorsPage;
