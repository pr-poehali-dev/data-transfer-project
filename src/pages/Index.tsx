import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SendScreen from '@/components/SendScreen';
import ReceiveScreen from '@/components/ReceiveScreen';
import ReceivedScreen from '@/components/ReceivedScreen';
import Icon from '@/components/ui/icon';

export default function Index() {
  const [activeTab, setActiveTab] = useState('send');

  const handleFileSent = (file: File) => {
    setActiveTab('history');
  };

  const handleFileReceived = () => {
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="ios-blur sticky top-0 z-10 border-b border-border/50">
          <div className="p-4 text-center">
            <h1 className="text-xl font-semibold tracking-tight">AirDrop</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="ios-blur sticky top-[72px] z-10 border-b border-border/50 px-6 pt-4">
            <TabsList className="w-full h-12 bg-accent/50 p-1 rounded-xl grid grid-cols-3">
              <TabsTrigger 
                value="send" 
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
              >
                <Icon name="Send" size={18} className="mr-1.5" />
                Передать
              </TabsTrigger>
              <TabsTrigger 
                value="receive"
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
              >
                <Icon name="Download" size={18} className="mr-1.5" />
                Получить
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
              >
                <Icon name="Clock" size={18} className="mr-1.5" />
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