import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SendScreen from '@/components/SendScreen';
import ReceivedScreen from '@/components/ReceivedScreen';
import Icon from '@/components/ui/icon';

export default function Index() {
  const [activeTab, setActiveTab] = useState('send');

  const handleFileSent = (file: File) => {
    setActiveTab('received');
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
            <TabsList className="w-full h-12 bg-accent/50 p-1 rounded-xl">
              <TabsTrigger 
                value="send" 
                className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
              >
                <Icon name="Send" size={18} className="mr-2" />
                Передать
              </TabsTrigger>
              <TabsTrigger 
                value="received"
                className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
              >
                <Icon name="Inbox" size={18} className="mr-2" />
                Полученные
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="send" className="mt-0">
            <SendScreen onFileSent={handleFileSent} />
          </TabsContent>

          <TabsContent value="received" className="mt-0">
            <ReceivedScreen />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
