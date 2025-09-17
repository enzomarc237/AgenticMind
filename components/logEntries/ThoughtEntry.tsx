import React from 'react';
import { ThoughtLogEntry } from '../../types';

interface ThoughtEntryProps {
  entry: ThoughtLogEntry;
}

export const ThoughtEntry: React.FC<ThoughtEntryProps> = ({ entry }) => {
  return (
    <details>
      <summary className="font-bold cursor-pointer">Thought</summary>
      <p className="pt-2">{entry.content}</p>
    </details>
  );
};
