import React, { useState } from 'react';
import { LogEntry, AgenticPattern, UserLogEntry, AILogEntry, SystemLogEntry, ThoughtLogEntry, ActionLogEntry, PlanLogEntry, ToolCallLogEntry, ToolResultLogEntry, AgentMessageLogEntry, ErrorLogEntry } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { ExportIcon } from './icons/ExportIcon';

const formatLogEntries = (entries: LogEntry[], format: 'text' | 'markdown'): string => {
  return entries.map(entry => {
    let title = `[${entry.type.toUpperCase()}]`;
    if ('agentName' in entry && entry.agentName) title += ` - ${entry.agentName}`;

    let content = '';

    switch (entry.type) {
      case 'user': content = (entry as UserLogEntry).content; break;
      case 'ai': content = (entry as AILogEntry).content; break;
      case 'system': content = (entry as SystemLogEntry).content; break;
      case 'thought': content = `Thought: ${(entry as ThoughtLogEntry).content}`; break;
      case 'action': content = `Action: ${(entry as ActionLogEntry).content}`; break;
      case 'agent-message': content = (entry as AgentMessageLogEntry).content; break;
      case 'error': content = `ERROR: ${(entry as ErrorLogEntry).content}`; break;
      case 'plan':
        const plan = entry as PlanLogEntry;
        content = 'Generated Plan:\n' + plan.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
        break;
      case 'tool-call':
        const toolCall = entry as ToolCallLogEntry;
        content = `Using Tool: ${toolCall.toolName}\nInput: ${toolCall.input}`;
        break;
      case 'tool-result':
        const toolResult = entry as ToolResultLogEntry;
        content = `Tool Result: ${toolResult.toolName}\n\n${toolResult.output}`;
        if (toolResult.sources && toolResult.sources.length > 0) {
          content += `\n\nSources:\n` + toolResult.sources.filter(s => s.web?.uri).map(s => `- ${s.web.title || s.web.uri}: ${s.web.uri}`).join('\n');
        }
        break;
      default:
        content = JSON.stringify(entry, null, 2);
    }

    if (format === 'markdown') {
      const mdTitle = `> **${title}**`;
      if (entry.type === 'ai' || entry.type === 'agent-message' || entry.type === 'action') {
         return `${mdTitle}\n\n${content}`;
      }
      if (entry.type === 'tool-call') {
         return `${mdTitle}\n\n*Using Tool: ${(entry as ToolCallLogEntry).toolName}*\n\`\`\`\n${(entry as ToolCallLogEntry).input}\n\`\`\``
      }
      return `${mdTitle}\n\n\`\`\`\n${content}\n\`\`\``;
    }

    return `${title}\n${content}`;
  }).join(format === 'markdown' ? '\n\n---\n\n' : '\n\n----------------\n\n');
};

interface InteractionToolbarProps {
    logEntries: LogEntry[];
    selectedPattern: AgenticPattern;
}

export const InteractionToolbar: React.FC<InteractionToolbarProps> = ({ logEntries, selectedPattern }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    
    if (logEntries.length === 0 || (logEntries.length === 1 && logEntries[0].id === 'api-key-error')) {
        return null;
    }
    
    const handleCopy = () => {
        const textToCopy = formatLogEntries(logEntries, 'text');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        });
    };
    
    const handleExport = () => {
        const markdownContent = formatLogEntries(logEntries, 'markdown');
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agentic-mind-${selectedPattern.toLowerCase()}-export.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center justify-end gap-2 px-4 pt-4 max-w-4xl mx-auto w-full">
            <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md transition-all"
                aria-label="Copy conversation to clipboard"
            >
                <CopyIcon className="w-4 h-4" />
                {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
            </button>
            <button
                onClick={handleExport}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md transition-all"
                aria-label="Export conversation as Markdown"
            >
                <ExportIcon className="w-4 h-4" />
                Export MD
            </button>
        </div>
    )
};
