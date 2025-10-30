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
}

export default function ReceivedScreen() {
  const [files, setFiles] = useState<FileData[]>([]);

  useEffect(() => {
    loadFiles();
    
    const handleStorageChange = () => {
      loadFiles();
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadFiles, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadFiles = () => {
    try {
      const savedFiles = JSON.parse(localStorage.getItem('received-files') || '[]');
      setFiles(savedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
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
    <div className="min-h-[calc(100vh-120px)] p-6 pb-20">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">История</h2>
          <p className="text-sm text-muted-foreground">
            {files.length === 0 ? 'Нет полученных файлов' : `Всего файлов: ${files.length}`}
          </p>
        </div>

        {files.length === 0 ? (
          <Card className="p-12 text-center backdrop-blur-sm bg-card/80 border-2 border-border/50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-accent/50 flex items-center justify-center">
                <Icon name="Inbox" size={48} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-lg text-muted-foreground">Нет файлов</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Полученные файлы появятся здесь
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id} className="p-4 hover:shadow-md transition-all backdrop-blur-sm bg-card/80 border border-border/50 hover:border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon name={getFileIcon(file.type)} size={28} className="text-primary" />
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