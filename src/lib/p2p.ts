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
        this.peer = new Peer(peerId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ]
          }
        });

        this.peer.on('open', (id) => {
          console.log('Peer ID:', id);
          if (this.onPeerIdCallback) {
            this.onPeerIdCallback(id);
          }
          resolve(id);
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
    this.connections.set(conn.peer, conn);

    conn.on('open', () => {
      console.log('Connection opened with:', conn.peer);
      if (this.onConnectionCallback) {
        this.onConnectionCallback(conn.peer);
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
      this.connections.delete(conn.peer);
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback(conn.peer);
      }
    });

    conn.on('error', (error) => {
      console.error('Connection error:', error);
      this.connections.delete(conn.peer);
    });
  }

  async connect(peerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'));
        return;
      }

      try {
        const conn = this.peer.connect(peerId, { reliable: true });
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
