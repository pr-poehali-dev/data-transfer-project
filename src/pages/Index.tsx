import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SendScreen from '@/components/SendScreen';
import ReceiveScreen from '@/components/ReceiveScreen';
import ReceivedScreen from '@/components/ReceivedScreen';
import Icon from '@/components/ui/icon';
import { getOrCreateDeviceId } from '@/lib/deviceId';

export default function Index() {
  const [activeTab, setActiveTab] = useState('send');
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  const handleFileSent = (file: File) => {
    setActiveTab('history');
  };

  const handleFileReceived = () => {
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto">
        <div className="backdrop-blur-xl sticky top-0 z-10 border-b border-border/30 bg-background/80">
          <div className="p-5 text-center">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">ShareDrop</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">Быстрая передача файлов</p>
              {deviceId && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <Icon name="Fingerprint" size={12} className="text-primary" />
                  <span className="text-xs font-mono font-semibold text-primary">{deviceId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="backdrop-blur-xl sticky top-[88px] z-10 border-b border-border/30 px-6 pt-4 bg-background/80">
            <TabsList className="w-full h-14 bg-accent/30 backdrop-blur-sm p-1.5 rounded-2xl grid grid-cols-3 border border-border/50">
              <TabsTrigger 
                value="send" 
                className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10 transition-all font-medium"
              >
                <Icon name="Send" size={20} className="mr-2" />
                Передать
              </TabsTrigger>
              <TabsTrigger 
                value="receive"
                className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10 transition-all font-medium"
              >
                <Icon name="Download" size={20} className="mr-2" />
                Получить
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10 transition-all font-medium"
              >
                <Icon name="Clock" size={20} className="mr-2" />
                История
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="send" className="mt-0">
            <SendScreen onFileSent={handleFileSent} />
          </TabsContent>

          <TabsContent value="receive" className="mt-0">
            <ReceiveScreen onFileReceived={handleFileReceived} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ReceivedScreen />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}