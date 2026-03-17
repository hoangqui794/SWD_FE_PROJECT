import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analyticsPromise = isSupported().then(yes => yes ? getAnalytics(app) : null);
const auth = getAuth(app);

// --- 1. LẮNG NGHE TRẠNG THÁI ONLINE/OFFLINE ---
export const listenToHubStatus = (hubId: number | string, callback: (isOnline: boolean) => void) => {
  return onValue(ref(database, `Hubs/${hubId}/IsOnline`), (snapshot) => {
    callback(!!snapshot.val());
  });
};

// --- 2. LẮNG NGHE DỮ LIỆU CẢM BIẾN (DATA) ---
export const listenToHubData = (hubId: number | string, callback: (data: any) => void) => {
  return onValue(ref(database, `Hubs/${hubId}/Data`), (snapshot) => {
    if (snapshot.exists()) callback(snapshot.val());
  });
};

// --- 3. LẮNG NGHE THÔNG BÁO CẢNH BÁO (ALERTS) ---
export const listenToHubAlerts = (hubId: number | string, callback: (alert: any) => void) => {
  return onValue(ref(database, `Hubs/${hubId}/Alert`), (snapshot) => {
    const alert = snapshot.val();
    if (alert) callback(alert);
  });
};

// Hàm cũ (Duy trì để ko lỗi DashBoard nếu chưa đổi kịp)
export const listenToHubRealtime = (hubId: number | string, callback: (data: any) => void) => {
  const hubRef = ref(database, `Hubs/${hubId}`);
  return onValue(hubRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      callback({
        hubId: hubId,
        isOnline: val.IsOnline,
        temperature: val.Data?.temperature || val.Temperature || 0,
        humidity: val.Data?.humidity || val.Humidity || 0,
        pressure: val.Data?.pressure || val.Pressure || 0,
        lux: val.Data?.lux || val.Lux || 0,
        lastUpdated: val.LastUpdated || new Date().toISOString()
      });
    }
  });
};

export { app, analyticsPromise as analytics, auth, database, db, storage };
export default app;
