import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [isNFCScanning, setIsNFCScanning] = useState(false);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setIsNFCSupported(true);
    }
  }, []);

  const startNFCScanning = async () => {
    if (!isNFCSupported) {
      toast.error('NFC не поддерживается', {
        description: 'Ваше устройство не поддерживает NFC',
      });
      return;
    }

    try {
      setIsNFCScanning(true);
      const ndef = new (window as any).NDEFReader();
      
      toast.info('Ожидание NFC...', {
        description: 'Поднесите телефон к NFC-метке',
        duration: 10000,
      });

      await ndef.scan();

      ndef.addEventListener('reading', ({ message }: any) => {
        const decoder = new TextDecoder();
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const textData = decoder.decode(record.data);
            try {
              const fileData = JSON.parse(textData);
              
              const savedFiles = JSON.parse(localStorage.getItem('received-files') || '[]');
              const exists = savedFiles.some((f: FileData) => f.id === fileData.id);
              
              if (!exists) {
                savedFiles.push(fileData);
                localStorage.setItem('received-files', JSON.stringify(savedFiles));
                localStorage.setItem(`file-${fileData.id}`, fileData.data);
                
                toast.success('Файл получен! 🎉', {
                  description: `${fileData.name} сохранён`,
                });
                
                onFileReceived();
              } else {
                toast.info('Файл уже существует', {
                  description: `${fileData.name} уже есть в списке`,
                });
              }
            } catch (e) {
              console.error('Error parsing NFC data:', e);
              toast.error('Ошибка чтения данных', {
                description: 'Неверный формат данных NFC',
              });
            }
          }
        }
      });

    } catch (error: any) {
      console.error('NFC Scan Error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Доступ запрещён', {
          description: 'Разрешите доступ к NFC в настройках',
        });
      } else if (error.name === 'NotSupportedError') {
        toast.error('NFC не поддерживается', {
          description: 'Ваше устройство не поддерживает Web NFC',
        });
      } else {
        toast.error('Ошибка сканирования NFC', {
          description: 'Попробуйте снова',
        });
      }
      setIsNFCScanning(false);
    }
  };

  const stopNFCScanning = () => {
    setIsNFCScanning(false);
    toast.dismiss();
    toast.info('Сканирование остановлено');
  };

  return (
    <div className="min-h-[calc(100vh-120px)] p-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Получить файл</h2>
            {isNFCSupported && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Icon name="Nfc" size={14} className="mr-1" />
                NFC
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isNFCSupported ? 'Поднесите телефон к NFC-метке для получения файла' : 'NFC не поддерживается на вашем устройстве'}
          </p>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center relative">
              {isNFCScanning ? (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                  <Icon name="Nfc" size={64} className="text-primary relative z-10 animate-pulse" />
                </>
              ) : (
                <Icon name="Download" size={64} className="text-primary" />
              )}
            </div>

            {isNFCScanning ? (
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Ожидание NFC...</p>
                <p className="text-sm text-muted-foreground">
                  Поднесите телефон к метке или другому устройству
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Готов к приёму</p>
                <p className="text-sm text-muted-foreground">
                  Нажмите кнопку и поднесите телефон к NFC-метке
                </p>
              </div>
            )}
          </div>
        </Card>

        {isNFCScanning ? (
          <Button
            onClick={stopNFCScanning}
            variant="destructive"
            className="w-full h-14 text-base font-semibold rounded-2xl"
            size="lg"
          >
            <Icon name="X" size={20} className="mr-2" />
            Остановить сканирование
          </Button>
        ) : (
          <Button
            onClick={startNFCScanning}
            disabled={!isNFCSupported}
            className="w-full h-14 text-base font-semibold rounded-2xl"
            size="lg"
          >
            <Icon name="Nfc" size={20} className="mr-2" />
            Начать приём
          </Button>
        )}

        <div className="text-center text-xs text-muted-foreground">
          {isNFCSupported ? (
            <>
              <p>Поддерживаются все типы файлов</p>
              <p className="mt-1">Файлы сохраняются автоматически</p>
            </>
          ) : (
            <>
              <p>NFC требует Android Chrome или Safari на iOS 13+</p>
              <p className="mt-1">Проверьте настройки браузера</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
