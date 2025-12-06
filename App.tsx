// App.tsx
import React, { useState } from 'react';
import type { Message } from './types';
import { ChatScreen } from './components/ChatScreen';
import { sendChatMessage } from './services/aiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  async function handleSendMessage(text: string) {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      setIsChatLoading(true);
      const reply = await sendChatMessage([...messages, userMessage], text);
      setMessages((prev) => [...prev, reply]);
    } catch (error) {
      console.error('Erreur lors de l’envoi du message Aurum :', error);
    } finally {
      setIsChatLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950">
      <ChatScreen
        messages={messages}
        onSend={handleSendMessage}
        isLoading={isChatLoading}
      />
    </div>
  );
};

export default App;
