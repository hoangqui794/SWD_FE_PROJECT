
import React, { useEffect } from 'react';
import { signalRService } from '../services/signalrService';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const RealtimeNotificationListener: React.FC = () => {
    const { showNotification } = useNotification();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) return;

        signalRService.startConnection();

        const handleReceiveAlert = (data: any) => {
            // Log này để debug - Bạn hãy kiểm tra xem có thấy chữ "!!! TOAST TRIGGERED !!!" không
            console.log("!!! TOAST TRIGGERED !!! Data:", data);

            const alertData = data.alert || data; // Hỗ trợ cả bọc trong alert hoặc flat
            if (!alertData) return;

            // Chuyển hết về chữ thường để so sánh cho chuẩn
            const priority = String(alertData.priority || '').toLowerCase();
            const ruleName = alertData.ruleName || alertData.sensorName || "Cảnh báo hệ thống";
            const message = alertData.message || "Phát hiện chỉ số bất thường";

            // Map màu sắc dựa trên priority: high, medium, low
            let type: 'error' | 'warning' | 'info' | 'success' = 'info';
            const p = priority.toLowerCase();

            if (p === 'high') {
                type = 'error';
            } else if (p === 'medium') {
                type = 'warning';
            } else if (p === 'low') {
                type = 'info';
            }

            const finalMessage = `${ruleName}: ${message}`;

            console.log("Calling showNotification with:", { finalMessage, type });
            showNotification(finalMessage, type);

            // Audio cho cảnh báo High
            if (type === 'error') {
                const audio = new Audio('/alert-sound.mp3');
                audio.play().catch(() => { });
            }
        };

        // Lắng nghe tất cả các phiên bản của event name (Hoa/Thường)
        signalRService.on("ReceiveAlertNotification", handleReceiveAlert);
        signalRService.on("receivealertnotification", handleReceiveAlert);

        return () => {
            signalRService.off("ReceiveAlertNotification", handleReceiveAlert);
            signalRService.off("receivealertnotification", handleReceiveAlert);
        };
    }, [isAuthenticated, showNotification]);

    return null;
};

export default RealtimeNotificationListener;
