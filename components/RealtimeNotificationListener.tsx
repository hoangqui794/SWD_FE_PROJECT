import React, { useEffect, useRef } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { listenToHubAlerts } from '../services/firebase';
import { hubService } from '../services/hubService';
import { notificationService } from '../services/notificationService';

/**
 * Component lắng nghe thông báo Real-time TOÀN CỤC.
 * Được mount tại App.tsx nên sẽ chạy xuyên suốt vòng đời ứng dụng.
 */
const RealtimeNotificationListener: React.FC = () => {
    const { showNotification } = useNotification();
    const { isAuthenticated } = useAuth();
    const unsubscribes = useRef<(() => void)[]>([]);
    const lastNotifiedId = useRef<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const setupGlobalListeners = async () => {
            try {
                // 1. Lấy danh sách Hubs từ Backend
                console.log("[FIREBASE GLOBAL] Đang tải danh sách Hubs để lắng nghe Firebase...");
                const hubs = await hubService.getAll();
                
                // Cleanup bất kỳ listener cũ nào trước khi tạo mới
                unsubscribes.current.forEach(unsub => unsub());
                unsubscribes.current = [];

                // 2. Với mỗi Hub, gắn một listener Firebase vào nốt /Alert
                hubs.forEach(hub => {
                    const unsub = listenToHubAlerts(hub.hubId, (alert: any) => {
                        if (!alert) return;
                        console.warn(`🔔 [FIREBASE] Alert từ Hub ${hub.hubId}:`, alert);

                        // Bóc tách dữ liệu theo đúng cấu trúc BE vừa cung cấp
                        const id = alert.id || alert.Id;
                        const message = alert.message || alert.Message || "Phát hiện chỉ số bất thường";
                        const ruleName = alert.ruleName || alert.RuleName || "Cảnh báo hệ thống";
                        const priority = String(alert.priority || alert.Priority || alert.severity || 'info').toLowerCase();
                        
                        // Chống trùng lặp (ID vẫn quan trọng để markAsRead)
                        if (id && id === lastNotifiedId.current) return;

                        // Map màu sắc dựa trên priority
                        let type: 'error' | 'warning' | 'info' | 'success' = 'info';
                        if (priority === 'high' || priority === 'urgent' || priority === 'critical') type = 'error';
                        else if (priority === 'medium') type = 'warning';

                        const finalMessage = `🚨 ${ruleName}: ${message}`;
                        
                        // HIỂN THỊ THÔNG BÁO TOÀN CỤC (TOAST) có nút xác nhận Thủ công
                        showNotification(
                            finalMessage, 
                            type,
                            "TÔI ĐÃ XEM",
                            () => {
                                notificationService.markAsRead(id).catch(err => {
                                    console.error("[FIREBASE GLOBAL] Không thể đánh dấu đã đọc:", err);
                                });
                            }
                        );

                        lastNotifiedId.current = id;
                    });
                    unsubscribes.current.push(unsub);
                });

                console.log(`[FIREBASE GLOBAL] Đã thiết lập xong ${hubs.length} Hub listeners.`);
            } catch (err) {
                console.error("[FIREBASE GLOBAL] Lỗi khi cài đặt thông báo:", err);
            }
        };

        setupGlobalListeners();

        return () => {
            unsubscribes.current.forEach(unsub => unsub());
            unsubscribes.current = [];
        };
    }, [isAuthenticated, showNotification]);

    return null;
};

export default RealtimeNotificationListener;
