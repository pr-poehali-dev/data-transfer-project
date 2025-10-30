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
}

export default function ReceivedScreen() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [isNFCScanning, setIsNFCScanning] = useState(false);

  useEffect(() => {
    loadFiles();
    if ('NDEFReader' in window) {
      setIsNFCSupported(true);
    }
  }, []);

  const loadFiles = () => {
    try {
      const savedFiles = JSON.parse(localStorage.getItem('received-files') || '[]');
      setFiles(savedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const startNFCScanning = async () => {
    if (!isNFCSupported) {
      toast.error('NFC не поддерживается');
      return;
    }

    try {
      setIsNFCScanning(true);
      const ndef = new (window as any).NDEFReader();
      
      toast.info('Ожидание NFC...', {
        description: 'Поднесите телефон к NFC-метке',
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
                
                setFiles(savedFiles);
                toast.success('Файл получен! 🎉', {
                  description: `${fileData.name} сохранён`,
                });
              } else {
                toast.info('Файл уже существует', {
                  description: `${fileData.name} уже есть в списке`,
                });
              }
            } catch (e) {
              console.error('Error parsing NFC data:', e);
            }
          }
        }
      });

    } catch (error: any) {
      console.error('NFC Scan Error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Доступ запрещен', {
          description: 'Разрешите доступ к NFC в настройках',
        });
      } else {
        toast.error('Ошибка сканирования NFC');
      }
    } finally {
      setIsNFCScanning(false);
    }
  };

  const handleDownload = (fileData: FileData) => {
    try {
      const fileContent = localStorage.getItem(`file-${fileData.id}`);
      if (!fileContent) {
        toast.error('Файл не найден');
        return;
      }

      const link = document.createElement('a');
      link.href = fileContent;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Файл загружен');
    } catch (error) {
      toast.error('Ошибка загрузки файла');
    }
  };

  const handleDelete = (fileId: string) => {
    try {
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      localStorage.setItem('received-files', JSON.stringify(updatedFiles));
      localStorage.removeItem(`file-${fileId}`);
      toast.success('Файл удален');
    } catch (error) {
      toast.error('Ошибка удаления файла');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Music';
    if (type.includes('pdf')) return 'FileText';
    return 'File';
  };

  return (
    <div className="min-h-[calc(100vh-120px)] p-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">Полученные файлы</h2>
            {isNFCSupported && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Icon name="Nfc" size={14} className="mr-1" />
                NFC
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {files.length === 0 ? 'Нет полученных файлов' : `Всего файлов: ${files.length}`}
          </p>
          {isNFCSupported && (
            <Button
              onClick={startNFCScanning}
              disabled={isNFCScanning}
              variant="outline"
              className="w-full max-w-sm h-12 rounded-xl border-2 border-primary/20 hover:bg-primary/5"
            >
              {isNFCScanning ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Ожидание NFC...
                </>
              ) : (
                <>
                  <Icon name="Nfc" size={20} className="mr-2" />
                  Принять файл через NFC
                </>
              )}
            </Button>
          )}
        </div>

        {files.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                <Icon name="Inbox" size={40} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Нет файлов</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Полученные файлы появятся здесь
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={getFileIcon(file.type)} size={24} className="text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.date)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file)}
                      className="h-10 w-10"
                    >
                      <Icon name="Download" size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(file.id)}
                      className="h-10 w-10 text-destructive hover:text-destructive"
                    >
                      <Icon name="Trash2" size={20} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}