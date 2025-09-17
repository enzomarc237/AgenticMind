import React from 'react';
import { AgentMessageLogEntry } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AgentMessageEntryProps {
  entry: AgentMessageLogEntry;
}

export const AgentMessageEntry: React.FC<AgentMessageEntryProps> = ({ entry }) => {
  return (
    <div>
      <div className="font-bold">{entry.agentName}</div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
    </div>
  );
};
