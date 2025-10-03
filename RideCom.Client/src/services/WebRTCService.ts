import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private config: WebRTCConfig;

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  async initializeLocalStream(): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  createPeerConnection(peerId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.config);
    
    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    this.peerConnections.set(peerId, peerConnection);
    return peerConnection;
  }

  getPeerConnection(peerId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(peerId);
  }

  removePeerConnection(peerId: string): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }
  }

  cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}