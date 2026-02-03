
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { alertService, Alert } from '../services/alertService';

const AlertsPage: React.FC = () => {
  // State management
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Resolved'>('All');
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20); // 20 alerts per page
  const [totalCount, setTotalCount] = useState(0);

  // Delete modal state
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch alerts khi component mount hoặc khi filter/search/page thay đổi
  useEffect(() => {
    fetchAlerts();
  }, [filterStatus, searchTerm, currentPage]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  /**
   * Hàm gọi API để lấy danh sách alerts
   */
  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await alertService.getAll(filterStatus, searchTerm);
      setAlerts(data);
      // Note: API hiện tại trả về tất cả data, chưa có pagination từ backend
      // Chúng ta sẽ implement client-side pagination
      setTotalCount(data.length);
    } catch (error) {
      console.error("Failed to fetch alerts", error);
      setError('Không thể tải dữ liệu alerts. Vui lòng kiểm tra kết nối.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Hàm xử lý resolve alert
   */
  const handleResolve = async (id: number) => {
    try {
      const response = await alertService.resolve(id);
      // Cập nhật local state
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
      showNotification(response.message || "Đã xử lý cảnh báo thành công!", 'success');
    } catch (error: any) {
      console.error("Failed to resolve alert", error);
      showNotification('Không thể xử lý alert: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  /**
   * Hàm xử lý xóa alert - Mở modal xác nhận
   */
  const handleDelete = (id: number) => {
    setAlertToDelete(id);
  };

  /**
   * Hàm thực hiện xóa alert sau khi xác nhận
   */
  const confirmDelete = async () => {
    if (alertToDelete === null) return;

    try {
      await alertService.delete(alertToDelete);
      // Xóa khỏi local state
      setAlerts(alerts.filter(a => a.id !== alertToDelete));
      setTotalCount(prev => prev - 1);
      setAlertToDelete(null); // Đóng modal
      showNotification("Đã xóa alert log thành công!", 'success');
    } catch (error: any) {
      console.error("Failed to delete alert", error);
      setAlertToDelete(null);
      // Hiển thị notification lỗi thay vì alert
      const errorMsg = error.response?.data?.message || error.message;
      showNotification('Lỗi: ' + errorMsg, 'error');
    }
  };

  /**
   * Get paginated alerts for current page
   */
  const getPaginatedAlerts = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return alerts.slice(startIndex, endIndex);
  };

  /**
   * Reset to page 1 when filter or search changes
   */
  const handleFilterChange = (status: 'All' | 'Active' | 'Resolved') => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  /**
   * Pagination handlers
   */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);

  const getSeverityStyle = (severity: string) => {
    return severity === 'Critical'
      ? 'bg-red-500/10 border-red-500 text-red-500'
      : 'bg-amber-500/10 border-amber-500 text-amber-500';
  };

  return (
    <Layout title="Alert History" breadcrumb="Monitoring Log">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">IoT Alert History Log</h3>
          <p className="text-slate-500 text-sm mt-1">Real-time monitoring anomalies and system warnings.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Resolved'].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status as any)}
              className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${filterStatus === status
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-border-muted overflow-hidden relative">
        <div className="p-4 border-b border-border-muted flex gap-4 items-center justify-between bg-zinc-900/30">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-background-dark border-border-muted text-xs rounded pl-10 focus:ring-1 focus:ring-primary h-9"
              placeholder="Search by sensor..."
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-slate-500">
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </div>
            <button
              onClick={fetchAlerts}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-border-muted rounded text-xs font-bold text-white flex items-center gap-2"
              disabled={isLoading}
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
              <p>Đang tải dữ liệu alerts...</p>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-lg m-4 border border-red-500/20">
            <p className="font-bold">Lỗi khi tải dữ liệu</p>
            <p className="text-sm opacity-80 mt-1">{error}</p>
            <button
              onClick={fetchAlerts}
              className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          /* Data Table */
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-zinc-900/50 border-b border-border-muted">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sensor</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Severity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
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
                      <span className={`flex items-center gap-2 text-[10px] font-bold uppercase ${alert.status === 'Active' ? 'text-red-500 animate-pulse' : 'text-slate-500'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${alert.status === 'Active' ? 'bg-red-500' : 'bg-slate-500'}`}></span>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === 'Active' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/50 rounded hover:bg-green-500/20 text-[10px] font-bold uppercase transition-colors"
                            title="Mark as Resolved"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                          title="Delete Log"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                      <span className="material-symbols-outlined text-4xl block mb-2 opacity-20">notifications_off</span>
                      No alerts found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-border-muted bg-zinc-900/30 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border border-border-muted rounded transition-colors"
              >
                <span className="material-symbols-outlined text-sm">first_page</span>
              </button>

              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border border-border-muted rounded transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1.5 text-xs font-bold border border-border-muted rounded transition-colors ${currentPage === pageNum
                          ? 'bg-white text-black'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border border-border-muted rounded transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>

              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border border-border-muted rounded transition-colors"
              >
                <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={alertToDelete !== null}
        onClose={() => setAlertToDelete(null)}
        title="Confirm Delete"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4 text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <span className="material-symbols-outlined text-3xl">warning</span>
            <div>
              <h4 className="font-bold uppercase text-sm">Warning: Irreversible Action</h4>
              <p className="text-xs opacity-80 mt-1">This action cannot be undone.</p>
            </div>
          </div>

          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to permanently delete this alert log?
            This will remove the record from the database.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setAlertToDelete(null)}
              className="flex-1 px-4 py-2.5 border border-border-muted text-white rounded text-xs font-bold uppercase hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded text-xs font-bold uppercase hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            >
              Delete Log
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded shadow-2xl border transition-all duration-300 animate-slide-in ${notification.type === 'success'
            ? 'bg-zinc-900 border-green-500 text-green-500'
            : 'bg-zinc-900 border-red-500 text-red-500'
          }`}>
          <span className="material-symbols-outlined">
            {notification.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <div>
            <h4 className="font-bold uppercase text-[10px] tracking-wider">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
            <p className="text-xs text-white/90 mt-0.5">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:bg-white/10 rounded p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </Layout>
  );
};

export default AlertsPage;
