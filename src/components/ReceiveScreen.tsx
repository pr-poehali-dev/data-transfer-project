import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  date: string;
  data: string;
}

interface ReceiveScreenProps {
  onFileReceived: () => void;
}

export default function ReceiveScreen({ onFileReceived }: ReceiveScreenProps) {
  const [isWaiting, setIsWaiting] = useState(false);
  const [incomingFile, setIncomingFile] = useState<FileData | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isWaiting && Math.random() > 0.7) {
        const mockFile: FileData = {
          id: Date.now().toString(),
          name: 'Document.pdf',
          size: 2458624,
          type: 'application/pdf',
          date: new Date().toISOString(),
          data: 'data:application/pdf;base64,mock'
        };
        setIncomingFile(mockFile);
        setIsWaiting(false);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isWaiting]);

  const startWaiting = () => {
    setIsWaiting(true);
    toast.info('Ожидание подключения...', {
      description: 'Убедитесь, что Bluetooth и Wi-Fi включены',
      duration: 10000,
    });
  };

  const stopWaiting = () => {
    setIsWaiting(false);
    setIncomingFile(null);
    toast.dismiss();
  };

  const acceptFile = async () => {
    if (!incomingFile) return;

    try {
      const savedFiles = JSON.parse(localStorage.getItem('received-files') || '[]');
      savedFiles.push(incomingFile);
      localStorage.setItem('received-files', JSON.stringify(savedFiles));
      localStorage.setItem(`file-${incomingFile.id}`, incomingFile.data);

      toast.success('Файл получен! 🎉', {
        description: `${incomingFile.name} сохранён`,
      });

      setIncomingFile(null);
      onFileReceived();

    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Ошибка сохранения файла');
    }
  };

  const rejectFile = () => {
    setIncomingFile(null);
    toast.info('Передача отклонена');
    startWaiting();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-[calc(100vh-120px)] p-6 pb-20">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Получить файл
          </h2>
          <p className="text-sm text-muted-foreground">
            Ожидайте подключения от отправителя
          </p>
        </div>

        <Card className="p-8 backdrop-blur-sm bg-card/80 border-2 border-border/50">
          <div className="flex flex-col items-center gap-6">
            {incomingFile ? (
              <>
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-xl animate-pulse">
                  <Icon name="FileText" size={64} className="text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold">Входящий файл</p>
                  <p className="text-lg font-medium">{incomingFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(incomingFile.size)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center relative shadow-lg">
                  {isWaiting ? (
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
                    {isWaiting ? 'Ожидание соединения...' : 'Готов к приёму'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isWaiting 
                      ? 'Устройство видимо для других'
                      : 'Нажмите кнопку для ожидания файлов'}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {incomingFile ? (
          <div className="space-y-3">
            <Button
              onClick={acceptFile}
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:shadow-xl hover:shadow-green-500/30 transition-all shadow-lg shadow-green-500/20"
              size="lg"
            >
              <Icon name="Check" size={20} className="mr-2" />
              Принять файл
            </Button>
            <Button
              onClick={rejectFile}
              variant="outline"
              className="w-full h-14 text-base font-semibold rounded-2xl border-2"
              size="lg"
            >
              <Icon name="X" size={20} className="mr-2" />
              Отклонить
            </Button>
          </div>
        ) : isWaiting ? (
          <Button
            onClick={stopWaiting}
            variant="destructive"
            className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg"
            size="lg"
          >
            <Icon name="X" size={20} className="mr-2" />
            Остановить ожидание
          </Button>
        ) : (
          <Button
            onClick={startWaiting}
            className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:shadow-primary/30 transition-all"
            size="lg"
          >
            <Icon name="Wifi" size={20} className="mr-2" />
            Начать ожидание
          </Button>
        )}

        <div className="text-center text-xs text-muted-foreground space-y-1 pt-2">
          <p>Bluetooth для обнаружения устройств</p>
          <p>Wi-Fi Direct для быстрой передачи</p>
        </div>
      </div>
    </div>
  );
}
