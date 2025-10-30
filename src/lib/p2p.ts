import Peer, { DataConnection } from 'peerjs';

export class P2PConnection {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onPeerIdCallback?: (id: string) => void;
  private onConnectionCallback?: (peerId: string) => void;
  private onDataCallback?: (data: any) => void;
  private onDisconnectCallback?: (peerId: string) => void;

  async initialize(peerId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const peerIdWithPrefix = peerId ? `sharedrop-${peerId}` : undefined;
        this.peer = new Peer(peerIdWithPrefix, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ]
          }
        });

        this.peer.on('open', (id) => {
          console.log('Peer ID:', id);
          const cleanId = id.replace('sharedrop-', '');
          if (this.onPeerIdCallback) {
            this.onPeerIdCallback(cleanId);
          }
          resolve(cleanId);
        });

        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });

        this.peer.on('error', (error) => {
          console.error('Peer error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private setupConnection(conn: DataConnection) {
    const cleanPeerId = conn.peer.replace('sharedrop-', '');
    this.connections.set(cleanPeerId, conn);

    conn.on('open', () => {
      console.log('Connection opened with:', conn.peer);
      if (this.onConnectionCallback) {
        this.onConnectionCallback(cleanPeerId);
      }
    });

    conn.on('data', (data) => {
      console.log('Received data from:', conn.peer);
      if (this.onDataCallback) {
        this.onDataCallback(data);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed with:', conn.peer);
      const cleanPeerId = conn.peer.replace('sharedrop-', '');
      this.connections.delete(cleanPeerId);
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback(cleanPeerId);
      }
    });

    conn.on('error', (error) => {
      console.error('Connection error:', error);
      const cleanPeerId = conn.peer.replace('sharedrop-', '');
      this.connections.delete(cleanPeerId);
    });
  }

  async connect(peerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'));
        return;
      }

      try {
        const fullPeerId = `sharedrop-${peerId}`;
        const conn = this.peer.connect(fullPeerId, { reliable: true });
        this.setupConnection(conn);

        conn.on('open', () => {
          resolve();
        });

        conn.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  send(peerId: string, data: any): boolean {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(data);
      return true;
    }
    return false;
  }

  broadcast(data: any) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }

  disconnect(peerId?: string) {
    if (peerId) {
      const conn = this.connections.get(peerId);
      if (conn) {
        conn.close();
        this.connections.delete(peerId);
      }
    } else {
      this.connections.forEach((conn) => conn.close());
      this.connections.clear();
    }
  }

  destroy() {
    this.disconnect();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  onPeerId(callback: (id: string) => void) {
    this.onPeerIdCallback = callback;
  }

  onConnection(callback: (peerId: string) => void) {
    this.onConnectionCallback = callback;
  }

  onData(callback: (data: any) => void) {
    this.onDataCallback = callback;
  }

  onDisconnect(callback: (peerId: string) => void) {
    this.onDisconnectCallback = callback;
  }

  getPeerId(): string | null {
    return this.peer?.id || null;
  }

  getConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  isConnected(peerId: string): boolean {
    const conn = this.connections.get(peerId);
    return conn ? conn.open : false;
  }
}

export const p2p = new P2PConnection();