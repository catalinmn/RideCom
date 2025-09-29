import { io, Socket } from 'socket.io-client';

export interface SignalingConfig {
  serverUrl: string;
  options?: any;
}

export interface SignalingMessage {
  type: string;
  data: any;
  from?: string;
  to?: string;
}

export class SignalingService {
  private socket: Socket | null = null;
  private config: SignalingConfig;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: SignalingConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.config.serverUrl, {
        transports: ['websocket'],
        ...this.config.options,
      });

      this.socket.on('connect', () => {
        console.log('Connected to signaling server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Failed to connect to signaling server:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from signaling server');
        this.emit('disconnect', {});
      });

      // Handle incoming signaling messages
      this.socket.on('signaling-message', (message: SignalingMessage) => {
        this.emit(message.type, message);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  send(message: SignalingMessage): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('signaling-message', message);
    } else {
      console.error('Cannot send message: not connected to signaling server');
    }
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler?: Function): void {
    if (!handler) {
      this.eventHandlers.delete(event);
      return;
    }

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}