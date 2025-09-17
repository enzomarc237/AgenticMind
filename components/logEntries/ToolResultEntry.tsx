import React from 'react';
import { ToolResultLogEntry } from '../../types';

interface ToolResultEntryProps {
  entry: ToolResultLogEntry;
}

export const ToolResultEntry: React.FC<ToolResultEntryProps> = ({ entry }) => {
  return (
    <div>
      <div className="font-bold">Tool Result: {entry.toolName}</div>
      <p className="mt-2">{entry.output}</p>
      {entry.sources && entry.sources.length > 0 && (
        <div className="mt-2">
          <h4 className="font-bold">Sources:</h4>
          <ul>
            {entry.sources.map((source, index) => (
              <li key={index}>
                <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {source.web?.title || source.web?.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
