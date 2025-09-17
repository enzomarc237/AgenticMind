import React, { useState, useEffect } from 'react';
import { getConversations } from '../services/geminiService';

interface Conversation {
  id: string;
  createdAt: string;
  prompt: string;
}

interface ConversationHistoryProps {
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ onSelectConversation, onNewChat }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      const convos = await getConversations();
      setConversations(convos);
    };
    fetchConversations();
  }, []);

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-4">Conversation History</h2>
      <button
        onClick={onNewChat}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
      >
        New Chat
      </button>
      <ul className="flex-1 overflow-y-auto">
        {conversations.map((convo) => (
          <li key={convo.id} className="mb-2">
            <button
              onClick={() => onSelectConversation(convo.id)}
              className="w-full text-left p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <div className="font-bold truncate">{convo.prompt}</div>
              <div className="text-sm text-gray-500">{new Date(convo.createdAt).toLocaleString()}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
