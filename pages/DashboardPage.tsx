import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { getDashboardStats, getRecentAlerts, DashboardStats } from '../services/dashboardService';
import { hubService, Hub, HubHistoricalData, HubSensorReadings } from '../services/hubService';
import { signalRService } from '../services/signalrService';

const DashboardPage: React.FC = () => {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Environmental Trends state (Current Data from API)
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);
  const [envSensors, setEnvSensors] = useState<HubSensorReadings[]>([]);
  const [envHubName, setEnvHubName] = useState<string>('');
  const [envLoading, setEnvLoading] = useState<boolean>(false);

  // Recent Alerts state
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);

  // History state
  const [historyData, setHistoryData] = useState<HubHistoricalData | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedHistorySensorId, setSelectedHistorySensorId] = useState<number | null>(null);

  const fetchStats = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
      setAlertsLoading(true);
    }

    // Fetch stats separately
    try {
      const stats = await getDashboardStats();
      console.log("Stats loaded:", stats);
      setStatsData(stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }

    // Fetch alerts separately
    try {
      const alerts = await getRecentAlerts(5);
      setRecentAlerts(alerts);
    } catch (error) {
      console.warn('Recent alerts API not available yet');
      setRecentAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchCurrentTemperature = useCallback(async (hubId: number) => {
    setEnvLoading(true);
    try {
      const data = await hubService.getCurrentEnvironment(hubId);
      setEnvSensors(data.sensors || []);
      setEnvHubName(data.name || '');
    } catch (error) {
      console.error('Failed to fetch current environment', error);
      setEnvSensors([]);
    } finally {
      setEnvLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (hubId: number, from: string, to: string) => {
    setHistoryLoading(true);
    try {
      const fromStr = `${from} 00:00:00`;
      const toStr = `${to} 23:59:59`;
      const data = await hubService.getReadings(hubId, fromStr, toStr);
      setHistoryData(data);
      // Tự động chọn sensor đầu tiên nếu chưa có cái nào được chọn
      if (data.sensors.length > 0) {
        setSelectedHistorySensorId(prev => prev || data.sensors[0].sensorId);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  }, []); // Gỡ bỏ phụ thuộc vào selectedHistorySensorId để tránh loop

  const fetchHubs = useCallback(async () => {
    try {
      const hubsData = await hubService.getAll();
      setHubs(hubsData);
      if (hubsData.length > 0 && !selectedHubId) {
        setSelectedHubId(hubsData[0].hubId);
      }
    } catch (error) {
      console.error("Failed to fetch hubs", error);
    }
  }, [selectedHubId]);

  const handleRefreshAll = useCallback(async () => {
    await fetchStats();
    await fetchHubs();
    if (selectedHubId) {
      await fetchCurrentTemperature(selectedHubId);
      await fetchHistory(selectedHubId, dateFrom, dateTo);
    }
  }, [fetchStats, fetchHubs, selectedHubId, fetchCurrentTemperature, fetchHistory, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
    fetchHubs();
  }, []);

  // Lắng nghe SignalR để cập nhật bảng Alert và Stats ngay lập tức
  useEffect(() => {
    const handleRealtimeUpdate = (data: any) => {
      console.log("Dashboard: SignalR alert received, updating UI immediately...", data);

      const payload = data?.alert;
      if (payload) {
        // Tạo một đối tượng alert mới giả lập từ dữ liệu SignalR để hiển thị ngay
        const newAlert = {
          id: Date.now(), // ID tạm thời
          sensorName: payload.sensorName || "Unknown Sensor",
          location: payload.siteName || "Unknown Location",
          value: payload.value,
          metricUnit: '',
          severity: payload.priority || 'High',
          status: 'Active',
          time: data.timestamp || new Date().toISOString()
        };

        // Đẩy cảnh báo mới lên đầu danh sách và giữ lại tối đa 5 cái
        setRecentAlerts(prev => {
          // Kiểm tra tránh trùng lặp nếu API và SignalR về cùng lúc
          const exists = prev.some(a => a.sensorName === newAlert.sensorName && a.time === newAlert.time);
          if (exists) return prev;
          return [newAlert, ...prev].slice(0, 5);
        });
      }

      fetchStats(true); // Cập nhật ngầm các stats khác như tổng số cảnh báo
    };

    signalRService.on("ReceiveAlertNotification", handleRealtimeUpdate);
    signalRService.on("receivealertnotification", handleRealtimeUpdate);

    return () => {
      signalRService.off("ReceiveAlertNotification", handleRealtimeUpdate);
      signalRService.off("receivealertnotification", handleRealtimeUpdate);
    };
  }, []);

  // Tự động lấy dữ liệu môi trường và lịch sử khi Hub thay đổi hoặc Ngày thay đổi
  useEffect(() => {
    if (selectedHubId) {
      fetchCurrentTemperature(selectedHubId);
      fetchHistory(selectedHubId, dateFrom, dateTo);
    }
  }, [selectedHubId, dateFrom, dateTo, fetchCurrentTemperature, fetchHistory]);

  const stats = [
    { label: "Total Sites", value: statsData?.total_sites?.toString() || "0", icon: "store" },
    { label: "Alerts Active", value: statsData?.pending_alerts?.toString() || "0", icon: "warning", color: statsData?.pending_alerts ? "text-red-500" : "text-white" },
    { label: "Total Hubs", value: statsData?.total_hubs?.toString() || "0", icon: "router", color: "text-primary" },
    { label: "Active Sensors", value: statsData?.active_sensors?.toString() || "0", icon: "sensors" },
  ];

  const selectedHub = useMemo(() => hubs.find(h => h.hubId === selectedHubId), [hubs, selectedHubId]);


  // History Chart Logic
  const selectedSensorHistory = useMemo(() => {
    if (!historyData || !selectedHistorySensorId) return null;
    return historyData.sensors.find(s => s.sensorId === selectedHistorySensorId);
  }, [historyData, selectedHistorySensorId]);

  const chartPaths = useMemo(() => {
    if (!selectedSensorHistory || selectedSensorHistory.readings.length < 2) return { line: "", area: "" };
    const values = selectedSensorHistory.readings.map(r => r.value).reverse();
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1)) * 100;
      const y = 40 - ((val - min) / range) * 30 - 5;
      return `${x},${y}`;
    });
    const line = `M${points[0]} ` + points.slice(1).map(p => `L${p}`).join(' ');
    const area = `${line} L100,40 L0,40 Z`;
    return { line, area };
  }, [selectedSensorHistory]);

  const getSensorIcon = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'temperature': return 'thermostat';
      case 'humidity': return 'humidity_percentage';
      case 'pressure': return 'speed';
      default: return 'sensors';
    }
  };

  const getSensorColor = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'temperature': return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', gradient: 'from-orange-500/20 to-transparent' };
      case 'humidity': return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/20 to-transparent' };
      case 'pressure': return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', gradient: 'from-purple-500/20 to-transparent' };
      default: return { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', gradient: 'from-slate-500/20 to-transparent' };
    }
  };

  const formatLastUpdate = (lastUpdate: string) => {
    if (!lastUpdate) return 'N/A';
    const date = new Date(lastUpdate);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Layout title="Dashboard" breadcrumb="Environment Overview">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Status</h3>
          <p className="text-slate-500 text-sm mt-1">Global metrics from {statsData?.total_sites || 0} active locations.</p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="px-4 py-2 bg-primary hover:bg-primary/80 transition-all rounded shadow-lg shadow-primary/20 hover:shadow-primary/30 text-xs font-bold text-white flex items-center gap-2"
        >
          <span className={`material-symbols-outlined text-sm ${(loading || envLoading || historyLoading) ? 'animate-spin' : ''}`}>refresh</span> Refresh
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 rounded-xl border border-slate-200 dark:border-border-muted bg-slate-50 dark:bg-white/5 flex flex-col justify-between h-32 transition-colors hover:border-primary/50 group">
            <div className="flex justify-between items-start">
              <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${stat.color || 'text-slate-400 dark:text-slate-600'}`}>{stat.icon}</span>
            </div>
            <p className={`text-4xl font-bold font-display ${stat.color && stat.color !== 'text-white' ? stat.color : 'text-slate-900 dark:text-white'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Section 1: Current Readings (API Driven) */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-bold">Current Environment</h4>
              {selectedHub && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${selectedHub.isOnline ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-red-500/20 bg-red-500/10'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedHub.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={`text-[10px] font-bold uppercase ${selectedHub.isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                    Hub {selectedHub.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-1">Latest readings from <span className="text-slate-900 dark:text-white font-medium">{envHubName || 'Selected Hub'}</span></p>
          </div>
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-border-muted">
            <select
              value={selectedHubId ?? ''}
              onChange={(e) => setSelectedHubId(Number(e.target.value))}
              className="bg-transparent border-none text-xs font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer outline-none"
            >
              {hubs.map(hub => (
                <option key={hub.hubId} value={hub.hubId} className='text-slate-900 bg-white'>{hub.name}</option>
              ))}
            </select>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              onClick={() => selectedHubId && fetchCurrentTemperature(selectedHubId)}
              className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {envLoading && envSensors.length === 0 ? (
          <div className="h-48 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-border-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {envSensors.map(sensor => {
              const color = getSensorColor(sensor.typeName);
              const latestReading = sensor.readings && sensor.readings.length > 0 ? sensor.readings[0] : null;

              return (
                <div key={sensor.sensorId} className={`relative overflow-hidden rounded-xl border ${color.border} bg-white dark:bg-white/5 p-6 hover:shadow-lg dark:hover:bg-white/[0.08] transition-all group`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} opacity-50`}></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center`}>
                          <span className={`material-symbols-outlined ${color.text}`}>{getSensorIcon(sensor.typeName)}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sensor.typeName}</p>
                          <p className="text-xs text-slate-300 mt-0.5">{sensor.name}</p>
                        </div>
                      </div>
                      {/* Sensor Status Dot */}
                      {(() => {
                        const latestReading = sensor.readings && sensor.readings.length > 0 ? sensor.readings[0] : null;
                        const isRecent = latestReading && (Date.now() - new Date(latestReading.recordedAt).getTime() < 300000);
                        const isSensorOnline = selectedHub?.isOnline && isRecent;

                        return (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isSensorOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                            <span className={`text-[10px] font-bold uppercase ${isSensorOnline ? 'text-emerald-500' : 'text-slate-500'}`}>
                              {isSensorOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="mb-3">
                      <span className={`text-3xl font-bold ${color.text}`}>
                        {latestReading ? latestReading.value.toFixed(1) : '--'}
                      </span>
                      <span className="text-lg text-slate-400 ml-1">{sensor.unit}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Last Update</span>
                      <span>{latestReading ? formatLastUpdate(latestReading.recordedAt) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Historical Readings (API Driven) */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Historical Readings</h4>
          <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-border-muted">
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer p-0 select-none"
              />
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer p-0 select-none"
              />
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              onClick={() => selectedHubId && fetchHistory(selectedHubId, dateFrom, dateTo)}
              className="px-3 py-1 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-transparent rounded text-[10px] font-bold uppercase transition-colors text-slate-700 dark:text-slate-300"
            >
              Get History
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {historyData?.sensors.map(s => (
              <button
                key={s.sensorId}
                onClick={() => setSelectedHistorySensorId(s.sensorId)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${selectedHistorySensorId === s.sensorId ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-slate-200 dark:border-border-muted bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-sm ${selectedHistorySensorId === s.sensorId ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>{getSensorIcon(s.typeName)}</span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{s.typeName}</p>
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{s.name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-border-muted p-6 relative min-h-[300px] transition-colors">
            {historyLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedSensorHistory ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{selectedSensorHistory.typeName} Trend</p>
                    <p className="text-[10px] text-slate-500 mt-1">{selectedSensorHistory.readings.length} data points collected</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedSensorHistory.readings.length > 0 ? selectedSensorHistory.readings[0].value.toFixed(1) : '--'}
                      <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">{selectedSensorHistory.unit}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Latest Value</p>
                  </div>
                </div>

                <div className="h-48 w-full relative">
                  {selectedSensorHistory.readings.length >= 2 ? (
                    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path d={chartPaths.line} fill="none" stroke="#1791cf" strokeWidth="0.5" className="chart-line" />
                      <path d={chartPaths.area} fill="url(#chartGradient)" />
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1791cf" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#1791cf" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600 text-sm italic">Not enough data to display trend</div>
                  )}
                </div>

                <div className="mt-6">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Recent Logs</p>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 font-extrabold uppercase tracking-widest">
                          <th className="pb-2">Time</th>
                          <th className="pb-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {selectedSensorHistory.readings.slice(0, 50).map((r, i) => (
                          <tr key={i} className="text-slate-600 dark:text-slate-300">
                            <td className="py-2">{new Date(r.recordedAt).toLocaleString()}</td>
                            <td className="py-2 text-right font-medium text-slate-900 dark:text-white">{r.value.toFixed(2)} {selectedSensorHistory.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                Select a sensor from the left to view history
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Priority Sensor Alerts</h4>
        <Link to="/alerts" className="text-primary text-xs font-bold hover:underline">View All History</Link>
      </div>
      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-border-muted overflow-hidden transition-colors shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Sensor Name</th>
              <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-center">Value</th>
              <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit">Status</th>
              <th className="px-6 py-4 text-[11px] font-extrabold uppercase tracking-widest text-inherit text-right">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-border-muted">
            {alertsLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading alerts...</td></tr>
            ) : recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{alert.sensorName} ({alert.severity})</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{alert.location}</div>
                  </td>
                  <td className={`px-6 py-4 text-center font-bold ${alert.severity?.toLowerCase() === 'high' ? 'text-red-500' :
                    alert.severity?.toLowerCase() === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                    {typeof alert.value === 'number' ? alert.value.toFixed(1) : alert.value} {alert.metricUnit}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${alert.severity?.toLowerCase() === 'high' ? 'bg-red-500 animate-ping' :
                        alert.severity?.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></div>
                      <span className={`text-xs font-medium uppercase ${alert.severity?.toLowerCase() === 'high' ? 'text-red-500' :
                        alert.severity?.toLowerCase() === 'medium' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-500">
                    {formatLastUpdate(alert.time)}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No recent alerts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default DashboardPage;
