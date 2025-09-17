import React from 'react';
import { ToolCallLogEntry } from '../../types';

interface ToolCallEntryProps {
  entry: ToolCallLogEntry;
}

export const ToolCallEntry: React.FC<ToolCallEntryProps> = ({ entry }) => {
  return (
    <div>
      <div className="font-bold">Tool Call: {entry.toolName}</div>
      <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded mt-2">
        <code>{entry.input}</code>
      </pre>
    </div>
  );
};
