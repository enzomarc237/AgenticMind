
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LogEntry, PlanLogEntry, ToolResultLogEntry, AgentMessageLogEntry } from '../types';
import { ReflectionIcon } from './icons/ReflectionIcon';
import { ToolUseIcon } from './icons/ToolUseIcon';
import { ReActIcon } from './icons/ReActIcon';
import { PlanningIcon } from './icons/PlanningIcon';
import { MultiAgentIcon } from './icons/MultiAgentIcon';
import { LoadingSpinner } from './LoadingSpinner';

interface InteractionViewProps {
  logEntries: LogEntry[];
  isLoading: boolean;
}

const EntryIcon: React.FC<{ type: LogEntry['type'] }> = ({ type }) => {
    const commonClasses = "w-6 h-6 text-gray-400";
    switch(type) {
        case 'user': return <svg xmlns="http://www.w3.org/2000/svg" className={commonClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
        case 'ai': return <ReflectionIcon className={commonClasses} />;
        case 'system': return <svg xmlns="http://www.w3.org/2000/svg" className={commonClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>;
        case 'thought': return <svg xmlns="http://www.w3.org/2000/svg" className={commonClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'action': return <ReActIcon className={commonClasses} />;
        case 'plan': return <PlanningIcon className={commonClasses} />;
        case 'tool-call': return <ToolUseIcon className={commonClasses} />;
        case 'tool-result': return <ToolUseIcon className={commonClasses} />;
        case 'agent-message': return <MultiAgentIcon className={commonClasses} />;
        case 'error': return <svg xmlns="http://www.w3.org/2000/svg" className={commonClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        default: return null;
    }
}

const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    if (inline) {
        return <code className="bg-gray-700 text-purple-300 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
    }
    
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    const codeContent = match ? (
        <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            wrapLines={true}
            customStyle={{ margin: 0, padding: '1rem', borderRadius: '0.375rem', background: '#1e293b' }}
            {...props}
        >
            {codeString}
        </SyntaxHighlighter>
    ) : (
        <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto"><code className="text-white" {...props}>{children}</code></pre>
    );

    return (
        <div className="relative my-2 text-sm">
             <button 
                onClick={() => handleCopy(codeString)}
                className={`absolute top-2 right-2 z-10 bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 text-xs rounded transition-all
                    ${isCopied ? 'bg-green-600' : ''}
                `}
                aria-label="Copy code to clipboard"
                disabled={isCopied}
            >
                {isCopied ? 'Copied!' : 'Copy'}
            </button>
            {codeContent}
        </div>
    );
};


const markdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 border-b border-gray-700 pb-2" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3 border-b border-gray-700 pb-1" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
    p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
    a: ({node, ...props}) => <a className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
    li: ({node, ...props}) => <li className="pl-2" {...props} />,
    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-4" {...props} />,
    table: ({node, ...props}) => <div className="overflow-x-auto"><table className="table-auto w-full my-4 border-collapse border border-gray-600" {...props} /></div>,
    thead: ({node, ...props}) => <thead className="bg-gray-700" {...props} />,
    th: ({node, ...props}) => <th className="border border-gray-600 px-4 py-2 text-left" {...props} />,
    td: ({node, ...props}) => <td className="border border-gray-600 px-4 py-2" {...props} />,
    code: CodeBlock,
};


const EntryCard: React.FC<{ children: React.ReactNode; entry: LogEntry; }> = ({ children, entry }) => {
  const bgColor = entry.type === 'user' ? 'bg-gray-800' : 'bg-gray-800/50';
  const borderColor = entry.type === 'error' ? 'border-red-500/50' : 'border-gray-700';

  return (
    <div className={`flex items-start space-x-4 p-4 rounded-lg border ${bgColor} ${borderColor}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mt-1">
        <EntryIcon type={entry.type} />
      </div>
      <div className="flex-1 text-gray-300 space-y-2 min-w-0">{children}</div>
    </div>
  );
};

export const InteractionView: React.FC<InteractionViewProps> = ({ logEntries, isLoading }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logEntries, isLoading]);
  
  const renderLogEntry = (entry: LogEntry) => {
    switch (entry.type) {
      case 'user':
        return <EntryCard entry={entry}><p>{entry.content}</p></EntryCard>;
      case 'ai':
        return <EntryCard entry={entry}><ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown></EntryCard>;
      case 'system':
        return <EntryCard entry={entry}><p className="font-semibold text-purple-400">{entry.content}</p></EntryCard>;
      case 'thought':
        return <EntryCard entry={entry}><div className="italic text-cyan-400">Thought: {entry.content}</div></EntryCard>;
      case 'action':
        return <EntryCard entry={entry}><div><strong className="text-green-400">Action:</strong> <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown></div></EntryCard>;
      case 'plan':
        const planEntry = entry as PlanLogEntry;
        return <EntryCard entry={entry}>
          <strong className="text-yellow-400">Plan Generated:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {planEntry.steps.map((step, index) => <li key={index}>{step}</li>)}
          </ul>
        </EntryCard>;
      case 'tool-call':
        return <EntryCard entry={entry}>
          <div><strong className="text-blue-400">Using Tool:</strong> {entry.toolName}</div>
          <div className="text-sm text-gray-400 bg-gray-900 p-2 rounded">Input: {entry.input}</div>
        </EntryCard>;
      case 'tool-result':
        const toolResultEntry = entry as ToolResultLogEntry;
        return <EntryCard entry={entry}>
          <div><strong className="text-blue-400">Tool Result:</strong> {toolResultEntry.toolName}</div>
           <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{toolResultEntry.output}</ReactMarkdown>
          {toolResultEntry.sources && toolResultEntry.sources.length > 0 && (
            <div className="mt-2">
                <strong className="text-gray-400 text-sm">Sources:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                    {toolResultEntry.sources
                      .filter(source => source.web?.uri)
                      .map(source => (
                        <a key={source.web.uri} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-700 text-cyan-400 hover:bg-gray-600 px-2 py-1 rounded-full transition-colors">
                            {source.web.title || new URL(source.web.uri!).hostname}
                        </a>
                    ))}
                </div>
            </div>
          )}
        </EntryCard>;
      case 'agent-message':
        const agentEntry = entry as AgentMessageLogEntry;
        return <EntryCard entry={entry}>
          <div><strong className="text-orange-400">{agentEntry.agentName}:</strong></div>
          <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{agentEntry.content}</ReactMarkdown>
        </EntryCard>;
      case 'error':
        return <EntryCard entry={entry}><p className="font-semibold text-red-400">{entry.content}</p></EntryCard>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-900/50">
      <div className="space-y-4 max-w-4xl mx-auto">
        {logEntries.map((entry) => (
          <div key={entry.id}>{renderLogEntry(entry)}</div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-3 p-4">
            <LoadingSpinner className="w-6 h-6 text-purple-400" />
            <span className="text-gray-400 animate-pulse">Agent is thinking...</span>
          </div>
        )}
      </div>
      <div ref={endOfMessagesRef} />
    </div>
  );
};