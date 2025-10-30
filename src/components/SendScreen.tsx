import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface SendScreenProps {
  onFileSent: (file: File) => void;
}

export default function SendScreen({ onFileSent }: SendScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async () => {
    if (!selectedFile) return;

    try {
      const savedFiles = JSON.parse(localStorage.getItem('received-files') || '[]');
      
      const fileData = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        date: new Date().toISOString(),
        id: Date.now().toString()
      };

      savedFiles.push(fileData);
      localStorage.setItem('received-files', JSON.stringify(savedFiles));

      const reader = new FileReader();
      reader.onload = (e) => {
        localStorage.setItem(`file-${fileData.id}`, e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);

      onFileSent(selectedFile);
      toast.success('Файл отправлен', {
        description: `${selectedFile.name} успешно передан`,
      });
      
      setSelectedFile(null);
    } catch (error) {
      toast.error('Ошибка отправки', {
        description: 'Не удалось передать файл',
      });
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Передать файл</h2>
          <p className="text-sm text-muted-foreground">
            Выберите файл для отправки
          </p>
        </div>

        <Card
          className={`p-8 transition-all duration-200 border-2 ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.98]'
              : selectedFile
              ? 'border-primary bg-card'
              : 'border-dashed border-border bg-card hover:bg-accent/50'
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
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="FileCheck" size={40} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
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
                  className="text-destructive hover:text-destructive"
                >
                  <Icon name="X" size={16} className="mr-2" />
                  Удалить
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                  <Icon name="Upload" size={40} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Нажмите для выбора</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    или перетащите файл сюда
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Button
          onClick={handleSend}
          disabled={!selectedFile}
          className="w-full h-14 text-base font-semibold rounded-2xl"
          size="lg"
        >
          <Icon name="Send" size={20} className="mr-2" />
          Передать файл
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          <p>Поднесите телефоны друг к другу</p>
          <p className="mt-1">для передачи через NFC или Bluetooth</p>
        </div>
      </div>
    </div>
  );
}
