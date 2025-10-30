import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { p2p } from '@/lib/p2p';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/deviceId';

interface ReceiveScreenProps {
  onFileReceived: () => void;
}

export default function ReceiveScreen({ onFileReceived }: ReceiveScreenProps) {
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [deviceName] = useState<string>(getDeviceName());
  const [connectedPeer, setConnectedPeer] = useState<string | null>(null);
  const [receivingProgress, setReceivingProgress] = useState<{
    fileName: string;
    fileSize: number;
    received: number;
    total: number;
  } | null>(null);

  const fileChunksRef = useRef<string[]>([]);

  useEffect(() => {
    const initP2P = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const id = await p2p.initialize(deviceId);
        setMyPeerId(id);
      } catch (error) {
        console.error('P2P init error:', error);
        toast.error('Ошибка инициализации');
      }
    };

    initP2P();

    p2p.onConnection((peerId) => {
      setConnectedPeer(peerId);
      toast.success('Устройство подключилось!', {
        description: `ID: ${peerId}`,
      });
    });

    p2p.onData((data) => {
      if (data.type === 'file-start') {
        setReceivingProgress({
          fileName: data.fileName,
          fileSize: data.fileSize,
          received: 0,
          total: data.totalChunks
        });
        fileChunksRef.current = [];
        toast.info('Получение файла...', {
          description: data.fileName,
        });
      } else if (data.type === 'file-chunk') {
        fileChunksRef.current.push(data.chunk);
        setReceivingProgress(prev => prev ? {
          ...prev,
          received: data.index + 1
        } : null);
      } else if (data.type === 'file-complete') {
        try {
          const fullData = fileChunksRef.current.join('');
          const fileData = JSON.parse(fullData);

          const savedFiles = JSON.parse(localStorage.getItem('received-files') || '[]');
          savedFiles.push(fileData);
          localStorage.setItem('received-files', JSON.stringify(savedFiles));
          localStorage.setItem(`file-${fileData.id}`, fileData.data);

          toast.success('Файл получен! 🎉', {
            description: fileData.name,
          });

          setReceivingProgress(null);
          fileChunksRef.current = [];
          onFileReceived();
        } catch (error) {
          console.error('File parsing error:', error);
          toast.error('Ошибка получения файла');
        }
      }
    });

    p2p.onDisconnect((peerId) => {
      setConnectedPeer(null);
      setReceivingProgress(null);
      toast.info('Устройство отключилось');
    });

    return () => {
      p2p.destroy();
    };
  }, [onFileReceived]);

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
    <div className="min-h-[calc(100vh-120px)] p-6 pb-20">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Получить файл
          </h2>
          <p className="text-sm text-muted-foreground">
            Поделитесь ID для получения файлов
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
              <p className="text-xs text-muted-foreground text-center pt-1">
                Отправьте этот ID другому устройству
              </p>
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
                <p className="font-medium text-sm">Устройство подключено</p>
                <p className="text-xs text-muted-foreground truncate">
                  {connectedPeer}
                </p>
              </div>
            </div>
          </Card>
        )}

        {receivingProgress && (
          <Card className="p-4 backdrop-blur-sm bg-primary/10 border-2 border-primary/30">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon name="Download" size={24} className="text-primary animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{receivingProgress.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(receivingProgress.fileSize)}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Получение...</span>
                  <span>{Math.round((receivingProgress.received / receivingProgress.total) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(receivingProgress.received / receivingProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-8 backdrop-blur-sm bg-card/80 border-2 border-border/50">
          <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center relative shadow-lg">
              {connectedPeer || receivingProgress ? (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping"></div>
                  <Icon name="Radio" size={64} className="text-primary relative z-10 animate-pulse" />
                </>
              ) : (
                <Icon name="Download" size={64} className="text-primary" />
              )}
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold">
                {receivingProgress 
                  ? 'Получение файла...'
                  : connectedPeer 
                  ? 'Ожидание файла' 
                  : 'Готов к подключению'}
              </p>
              <p className="text-sm text-muted-foreground">
                {receivingProgress
                  ? 'Не закрывайте страницу'
                  : connectedPeer
                  ? 'Устройство может отправить файл'
                  : 'Поделитесь ID выше для получения'}
              </p>
            </div>
          </div>
        </Card>

        <div className="text-center text-xs text-muted-foreground space-y-1 pt-2">
          <p>Прямое P2P соединение через WebRTC</p>
          <p>Файлы передаются напрямую между устройствами</p>
        </div>
      </div>
    </div>
  );
}