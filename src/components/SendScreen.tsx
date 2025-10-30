import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { p2p } from '@/lib/p2p';
import { Input } from '@/components/ui/input';

interface SendScreenProps {
  onFileSent: (file: File) => void;
}

export default function SendScreen({ onFileSent }: SendScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initP2P = async () => {
      try {
        const id = await p2p.initialize();
        setMyPeerId(id);
        toast.success('Готов к передаче', {
          description: `Ваш ID: ${id.substring(0, 8)}...`,
        });
      } catch (error) {
        console.error('P2P init error:', error);
        toast.error('Ошибка инициализации');
      }
    };

    initP2P();

    p2p.onConnection((peerId) => {
      setConnectedPeer(peerId);
      toast.success('Устройство подключено!', {
        description: `ID: ${peerId.substring(0, 8)}...`,
      });
    });

    p2p.onDisconnect((peerId) => {
      if (connectedPeer === peerId) {
        setConnectedPeer(null);
        toast.info('Устройство отключено');
      }
    });

    return () => {
      p2p.destroy();
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const connectToPeer = async () => {
    if (!targetPeerId.trim()) {
      toast.error('Введите ID устройства');
      return;
    }

    try {
      setIsConnecting(true);
      await p2p.connect(targetPeerId);
      setConnectedPeer(targetPeerId);
      toast.success('Подключено к устройству!');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Не удалось подключиться', {
        description: 'Проверьте ID устройства',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const sendFile = async () => {
    if (!selectedFile || !connectedPeer) return;

    try {
      setIsSending(true);
      toast.info('Отправка файла...', {
        description: 'Не закрывайте страницу',
      });

      const fileReader = new FileReader();
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsDataURL(selectedFile);
      });

      const fileData = {
        type: 'file',
        name: selectedFile.name,
        size: selectedFile.size,
        fileType: selectedFile.type,
        date: new Date().toISOString(),
        id: Date.now().toString(),
        data: fileDataUrl
      };

      const chunkSize = 16384;
      const data = JSON.stringify(fileData);
      const totalChunks = Math.ceil(data.length / chunkSize);

      p2p.send(connectedPeer, {
        type: 'file-start',
        totalChunks,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });

      for (let i = 0; i < totalChunks; i++) {
        const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
        p2p.send(connectedPeer, {
          type: 'file-chunk',
          chunk,
          index: i,
          totalChunks
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      p2p.send(connectedPeer, {
        type: 'file-complete'
      });

      onFileSent(selectedFile);
      toast.success('Файл отправлен! 🎉', {
        description: `${selectedFile.name}`,
      });

      setSelectedFile(null);

    } catch (error) {
      console.error('Send error:', error);
      toast.error('Ошибка отправки файла');
    } finally {
      setIsSending(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const copyPeerId = () => {
    navigator.clipboard.writeText(myPeerId);
    toast.success('ID скопирован!');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6 pb-20">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Передать файл
          </h2>
          <p className="text-sm text-muted-foreground">
            Подключитесь к устройству и отправьте файл
          </p>
        </div>

        {myPeerId && (
          <Card className="p-4 backdrop-blur-sm bg-card/80 border-2 border-primary/20">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Ваш ID для подключения:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-accent text-sm font-mono truncate">
                  {myPeerId}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyPeerId}
                  className="flex-shrink-0"
                >
                  <Icon name="Copy" size={16} />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!connectedPeer && (
          <Card className="p-4 backdrop-blur-sm bg-card/80 border-2 border-border/50">
            <div className="space-y-3">
              <p className="text-sm font-medium">Подключиться к устройству:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите ID устройства"
                  value={targetPeerId}
                  onChange={(e) => setTargetPeerId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={connectToPeer}
                  disabled={isConnecting || !targetPeerId.trim()}
                  size="icon"
                  className="flex-shrink-0"
                >
                  {isConnecting ? (
                    <Icon name="Loader2" size={20} className="animate-spin" />
                  ) : (
                    <Icon name="Link" size={20} />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {connectedPeer && (
          <Card className="p-4 backdrop-blur-sm bg-green-500/10 border-2 border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Icon name="CheckCircle" size={24} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Подключено</p>
                <p className="text-xs text-muted-foreground truncate">
                  {connectedPeer}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  p2p.disconnect(connectedPeer);
                  setConnectedPeer(null);
                }}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          </Card>
        )}

        <Card
          className={`p-8 transition-all duration-300 border-2 backdrop-blur-sm ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.98] shadow-lg shadow-primary/20'
              : selectedFile
              ? 'border-primary/50 bg-card/80 shadow-md'
              : 'border-dashed border-border/50 bg-card/50 hover:bg-accent/30 hover:border-primary/30'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex flex-col items-center gap-4">
            {selectedFile ? (
              <>
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
                  <Icon name="FileCheck" size={48} className="text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Icon name="X" size={16} className="mr-2" />
                  Удалить
                </Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-2xl bg-accent/50 flex items-center justify-center">
                  <Icon name="Upload" size={48} className="text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold">Нажмите для выбора</p>
                  <p className="text-sm text-muted-foreground">
                    или перетащите файл сюда
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Button
          onClick={sendFile}
          disabled={!selectedFile || !connectedPeer || isSending}
          className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:shadow-primary/30 transition-all"
          size="lg"
        >
          {isSending ? (
            <>
              <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Icon name="Send" size={20} className="mr-2" />
              Отправить файл
            </>
          )}
        </Button>

        <div className="text-center text-xs text-muted-foreground space-y-1 pt-2">
          <p>Прямое P2P соединение через WebRTC</p>
          <p>Файлы передаются напрямую между устройствами</p>
        </div>
      </div>
    </div>
  );
}
