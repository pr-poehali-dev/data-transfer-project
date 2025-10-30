import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import QrScanner from 'qr-scanner';

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
  const [isQRScanning, setIsQRScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setIsNFCSupported(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
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

  const startQRScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsQRScanning(true);

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          try {
            const fileData = JSON.parse(result.data);
            
            const savedFiles = JSON.parse(localStorage.getItem('received-files') || '[]');
            const exists = savedFiles.some((f: any) => f.id === fileData.id);
            
            if (!exists) {
              savedFiles.push(fileData);
              localStorage.setItem('received-files', JSON.stringify(savedFiles));
              localStorage.setItem(`file-${fileData.id}`, fileData.data);
              
              toast.success('Файл получен! 🎉', {
                description: `${fileData.name} сохранён`,
              });
              
              stopQRScanning();
              onFileReceived();
            } else {
              toast.info('Файл уже существует');
              stopQRScanning();
            }
          } catch (e) {
            console.error('Error parsing QR data:', e);
            toast.error('Неверный QR-код', {
              description: 'Это не QR-код с файлом',
            });
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current = qrScanner;
      await qrScanner.start();

      toast.info('Сканируйте QR-код', {
        description: 'Наведите камеру на QR-код',
      });

    } catch (error: any) {
      console.error('QR Scanner Error:', error);
      toast.error('Ошибка камеры', {
        description: 'Разрешите доступ к камере',
      });
      setIsQRScanning(false);
    }
  };

  const stopQRScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsQRScanning(false);
    toast.dismiss();
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
            Выберите способ получения файла
          </p>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center gap-6">
            {isQRScanning ? (
              <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-primary/50 rounded-2xl pointer-events-none"></div>
              </div>
            ) : (
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
            )}

            {isQRScanning ? (
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Сканирование...</p>
                <p className="text-sm text-muted-foreground">
                  Наведите камеру на QR-код
                </p>
              </div>
            ) : isNFCScanning ? (
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
                  Выберите способ получения файла
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          {isQRScanning ? (
            <Button
              onClick={stopQRScanning}
              variant="destructive"
              className="w-full h-14 text-base font-semibold rounded-2xl"
              size="lg"
            >
              <Icon name="X" size={20} className="mr-2" />
              Остановить
            </Button>
          ) : isNFCScanning ? (
            <Button
              onClick={stopNFCScanning}
              variant="destructive"
              className="w-full h-14 text-base font-semibold rounded-2xl"
              size="lg"
            >
              <Icon name="X" size={20} className="mr-2" />
              Остановить
            </Button>
          ) : (
            <>
              <Button
                onClick={startQRScanning}
                className="w-full h-14 text-base font-semibold rounded-2xl"
                size="lg"
              >
                <Icon name="QrCode" size={20} className="mr-2" />
                Сканировать QR-код
              </Button>

              {isNFCSupported && (
                <Button
                  onClick={startNFCScanning}
                  variant="outline"
                  className="w-full h-14 text-base font-semibold rounded-2xl"
                  size="lg"
                >
                  <Icon name="Nfc" size={20} className="mr-2" />
                  Принять через NFC
                </Button>
              )}
            </>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>QR-код работает на всех устройствах</p>
          {isNFCSupported && (
            <p className="mt-1">NFC для быстрой передачи между телефонами</p>
          )}
        </div>
      </div>
    </div>
  );
}
