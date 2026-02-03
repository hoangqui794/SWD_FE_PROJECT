import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_URL } from '../config';

class SignalRService {
    private connection: signalR.HubConnection;


    constructor() {
        console.warn("SignalR Service Instantiated");
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(SIGNALR_HUB_URL, {
                accessTokenFactory: () => localStorage.getItem('token') || ''
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.onreconnecting(error => {
            console.warn(`Connection lost due to error "${error}". Reconnecting...`);
            this.notifyStateChange("Reconnecting");
        });

        this.connection.onreconnected(connectionId => {
            console.log(`Connection reestablished. Connected with connectionId "${connectionId}".`);
            this.notifyStateChange("Connected");
        });

        this.connection.onclose(error => {
            console.error(`Connection closed due to error "${error}". Try refreshing this page to restart the connection.`);
            this.notifyStateChange("Disconnected");
        });
    }

    private connectionStateListeners: ((status: string) => void)[] = [];

    public addConnectionStateListener(callback: (status: string) => void) {
        this.connectionStateListeners.push(callback);
        // Send current state immediately
        callback(this.connection.state);
    }

    public removeConnectionStateListener(callback: (status: string) => void) {
        this.connectionStateListeners = this.connectionStateListeners.filter(listener => listener !== callback);
    }

    private notifyStateChange(status: string) {
        this.connectionStateListeners.forEach(listener => listener(status));
    }

    public async startConnection() {
        this.notifyStateChange("Connecting...");
        console.warn("SignalR: Attempting to connect...", this.connection.state);
        try {
            if (this.connection.state === signalR.HubConnectionState.Disconnected) {
                await this.connection.start();
                console.warn('SignalR Connected Successfully!');
                this.notifyStateChange("Connected");
            } else {
                this.notifyStateChange(this.connection.state);
            }
        } catch (err: any) {
            console.error('Error while starting connection: ', err);
            this.notifyStateChange(`Error: ${err.message || 'Unknown error'}`);
            setTimeout(() => this.startConnection(), 5000);
        }
    }

    public on(methodName: string, callback: (...args: any[]) => void) {
        this.connection.on(methodName, callback);
    }

    public off(methodName: string, callback: (...args: any[]) => void) {
        this.connection.off(methodName, callback);
    }
}

export const signalRService = new SignalRService();
