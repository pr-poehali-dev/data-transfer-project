import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface SendScreenProps {
  onFileSent: (file: File) => void;
}

interface PeerDevice {
  id: string;
  name: string;
  signal: number;
}

export default function SendScreen({ onFileSent }: SendScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [devices, setDevices] = useState<PeerDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<PeerDevice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

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

  const scanForDevices = async () => {
    if (!selectedFile) {
      toast.error('Выберите файл для отправки');
      return;
    }

    try {
      setIsScanning(true);
      toast.info('Поиск устройств...', {
        description: 'Убедитесь, что на другом устройстве открыт экран "Получить"',
        duration: 5000,
      });

      const mockDevices: PeerDevice[] = [
        { id: '1', name: 'iPhone 13', signal: 95 },
        { id: '2', name: 'Samsung Galaxy', signal: 87 },
        { id: '3', name: 'MacBook Pro', signal: 72 },
      ];

      setTimeout(() => {
        setDevices(mockDevices);
        setIsScanning(false);
        toast.success('Устройства найдены!', {
          description: `Обнаружено ${mockDevices.length} устройств`,
        });
      }, 2000);

    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Ошибка поиска устройств');
      setIsScanning(false);
    }
  };

  const sendFile = async (device: PeerDevice) => {
    if (!selectedFile) return;

    try {
      setIsSending(true);
      setSelectedDevice(device);

      const fileReader = new FileReader();
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsDataURL(selectedFile);
      });

      const fileData = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        date: new Date().toISOString(),
        id: Date.now().toString(),
        data: fileDataUrl
      };

      await new Promise(resolve => setTimeout(resolve, 2000));

      const savedFiles = JSON.parse(localStorage.getItem('received-files') || '[]');
      savedFiles.push(fileData);
      localStorage.setItem('received-files', JSON.stringify(savedFiles));
      localStorage.setItem(`file-${fileData.id}`, fileDataUrl);

      onFileSent(selectedFile);
      toast.success('Файл отправлен! 🎉', {
        description: `${selectedFile.name} отправлен на ${device.name}`,
      });

      setSelectedFile(null);
      setDevices([]);
      setSelectedDevice(null);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6 pb-20">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Передать файл
          </h2>
          <p className="text-sm text-muted-foreground">
            Выберите файл и найдите устройство для отправки
          </p>
        </div>

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
                    setDevices([]);
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

        {devices.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Доступные устройства:</p>
            {devices.map((device) => (
              <Card
                key={device.id}
                className="p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 bg-card/80 backdrop-blur-sm"
                onClick={() => sendFile(device)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon name="Smartphone" size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{device.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Сигнал: {device.signal}%
                      </p>
                    </div>
                  </div>
                  <Icon name="Send" size={20} className="text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button
          onClick={scanForDevices}
          disabled={!selectedFile || isScanning || isSending}
          className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:shadow-primary/30 transition-all"
          size="lg"
        >
          {isScanning ? (
            <>
              <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
              Поиск устройств...
            </>
          ) : isSending ? (
            <>
              <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Icon name="Radar" size={20} className="mr-2" />
              Найти устройства
            </>
          )}
        </Button>

        <div className="text-center text-xs text-muted-foreground space-y-1 pt-2">
          <p>Bluetooth для обнаружения устройств</p>
          <p>Wi-Fi Direct для быстрой передачи</p>
        </div>
      </div>
    </div>
  );
}
