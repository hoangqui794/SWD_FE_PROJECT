import React, { useEffect, useRef } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { listenToHubAlerts } from '../services/firebase';
import { hubService } from '../services/hubService';

/**
 * Component lắng nghe thông báo Real-time TOÀN CỤC.
 * Được mount tại App.tsx nên sẽ chạy xuyên suốt vòng đời ứng dụng.
 */
const RealtimeNotificationListener: React.FC = () => {
    const { showNotification } = useNotification();
    const { isAuthenticated } = useAuth();
    const unsubscribes = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const setupGlobalListeners = async () => {
            try {
                // 1. Lấy danh sách tất cả Hubs mà user có quyền truy cập
                console.log("[FIREBASE GLOBAL] Đang tải danh sách Hubs cho thông báo toàn cục...");
                const hubs = await hubService.getAll();
                
                // Cleanup bất kỳ listener cũ nào trước khi tạo mới (tránh trùng lặp)
                unsubscribes.current.forEach(unsub => unsub());
                unsubscribes.current = [];

                // 2. Với mỗi Hub, gắn một listener Firebase vào nốt /Alert
                hubs.forEach(hub => {
                    const unsub = listenToHubAlerts(hub.hubId, (alert) => {
                        if (!alert) return;

                        console.log(`>>> [GLOBAL ALERT] Hub ${hub.hubId}:`, alert);

                        const priority = String(alert.priority || '').toLowerCase();
                        const ruleName = alert.ruleName || "Cảnh báo hệ thống";
                        const message = alert.message || "Phát hiện chỉ số bất thường";
                        const value = alert.value !== undefined ? ` (Giá trị: ${alert.value})` : "";

                        // Map màu sắc dựa trên mức độ nghiêm trọng
                        let type: 'error' | 'warning' | 'info' | 'success' = 'info';
                        if (priority === 'high' || priority === 'urgent') type = 'error';
                        else if (priority === 'medium') type = 'warning';
                        else if (priority === 'low') type = 'info';

                        const finalMessage = `🚨 ${ruleName}: ${message}${value}`;
                        
                        // HIỂN THỊ THÔNG BÁO TOÀN CỤC (TOAST)
                        // Vì component này ở App.tsx nên dù user đang ở trang nào cũng sẽ thấy
                        showNotification(finalMessage, type);
                    });
                    unsubscribes.current.push(unsub);
                });

                console.log(`[FIREBASE GLOBAL] Đã thiết lập lắng nghe Alert cho ${hubs.length} Hubs.`);
            } catch (err) {
                console.error("[FIREBASE GLOBAL] Lỗi khi cài đặt thông báo:", err);
            }
        };

        setupGlobalListeners();

        return () => {
            console.log("[FIREBASE GLOBAL] Cleanup: Đã gỡ bỏ các listener cảnh báo.");
            unsubscribes.current.forEach(unsub => unsub());
            unsubscribes.current = [];
        };
    }, [isAuthenticated, showNotification]);

    return null;
};

export default RealtimeNotificationListener;
