
import React, { useEffect } from 'react';
import { signalRService } from '../services/signalrService';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

/**
 * Component này không render gì cả, chỉ dùng để lắng nghe các sự kiện SignalR toàn cục
 * và hiển thị thông báo (Toast) cho người dùng.
 */
const RealtimeNotificationListener: React.FC = () => {
    const { showNotification } = useNotification();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) return;

        // Bắt đầu kết nối SignalR nếu chưa có
        signalRService.startConnection();

        // 1. Lắng nghe các cảnh báo về chỉ số (Nhiệt độ, độ ẩm, áp suất...)
        // Giả sử sự kiện là "ReceiveAlert" dựa trên các pattern hiện có
        const handleReceiveAlert = (alert: any) => {
            console.log("Realtime Alert received:", alert);

            // Format tin nhắn: "Cảnh báo: [Sensor Name] đạt [Value][Unit] - [Severity]"
            const message = `${alert.sensorName || 'Sensor'}: ${alert.message || 'vượt ngưỡng an toàn!'} (${alert.value || ''}${alert.unit || ''})`;

            showNotification(
                message,
                alert.severity?.toLowerCase() === 'critical' ? 'error' : 'warning'
            );

            // Có thể thêm âm thanh thông báo ở đây nếu cần
            if (alert.severity?.toLowerCase() === 'critical') {
                const audio = new Audio('/alert-sound.mp3'); // Nếu có file âm thanh
                audio.play().catch(e => console.log("Audio play failed", e));
            }
        };

        // 2. Lắng nghe các thay đổi về trạng thái Hub (Online/Offline)
        const handleHubStatusChange = (data: any) => {
            const isOnline = data.isOnline ?? data.status === 'Online';
            if (!isOnline) {
                showNotification(`Hub ${data.name || data.hubId} đã mất kết nối!`, 'error');
            } else {
                showNotification(`Hub ${data.name || data.hubId} đã trực tuyến trở lại.`, 'success');
            }
        };

        // Đăng ký listeners
        signalRService.on("ReceiveAlert", handleReceiveAlert);
        signalRService.on("ReceiveHubStatusChange", handleHubStatusChange);

        return () => {
            // Hủy đăng ký khi component unmount
            signalRService.off("ReceiveAlert", handleReceiveAlert);
            signalRService.off("ReceiveHubStatusChange", handleHubStatusChange);
        };
    }, [isAuthenticated, showNotification]);

    return null; // Component này không hiển thị UI
};

export default RealtimeNotificationListener;
