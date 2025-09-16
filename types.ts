
export enum AgenticPattern {
  Reflection = 'Reflection',
  ToolUse = 'ToolUse',
  ReAct = 'ReAct',
  Planning = 'Planning',
  MultiAgent = 'MultiAgent',
}

export interface BaseLogEntry {
  id: string;
  type: 'user' | 'ai' | 'system' | 'thought' | 'action' | 'plan' | 'tool-call' | 'tool-result' | 'agent-message' | 'error';
}

export interface UserLogEntry extends BaseLogEntry {
  type: 'user';
  content: string;
}

export interface AILogEntry extends BaseLogEntry {
  type: 'ai';
  content: string;
}

export interface SystemLogEntry extends BaseLogEntry {
  type: 'system';
  content: string;
  pattern: AgenticPattern;
}

export interface ThoughtLogEntry extends BaseLogEntry {
  type: 'thought';
  content: string;
}

export interface ActionLogEntry extends BaseLogEntry {
  type: 'action';
  content: string;
}

export interface PlanLogEntry extends BaseLogEntry {
  type: 'plan';
  steps: string[];
  completedSteps: number[];
}

export interface ToolCallLogEntry extends BaseLogEntry {
  type: 'tool-call';
  toolName: string;
  input: string;
}

export interface GroundingChunk {
  // FIX: Made the 'web' property optional to match the @google/genai library type.
  web?: {
    uri?: string;
    title?: string;
  };
}
export interface ToolResultLogEntry extends BaseLogEntry {
  type: 'tool-result';
  toolName: string;
  output: string;
  sources?: GroundingChunk[];
}

export interface AgentMessageLogEntry extends BaseLogEntry {
  type: 'agent-message';
  agentName: string;
  content: string;
}

export interface ErrorLogEntry extends BaseLogEntry {
  type: 'error';
  content: string;
}

export type LogEntry =
  | UserLogEntry
  | AILogEntry
  | SystemLogEntry
  | ThoughtLogEntry
  | ActionLogEntry
  | PlanLogEntry
  | ToolCallLogEntry
  | ToolResultLogEntry
  | AgentMessageLogEntry
  | ErrorLogEntry;