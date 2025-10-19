
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

// ============================================================================
// Authentication and User Types
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  theme: 'light' | 'dark'
  temperature: number
  top_k: number
  top_p: number
  reflection_prompts: any
  tool_use_prompts: any
  react_prompts: any
  planning_prompts: any
  multi_agent_prompts: any
  created_at: string
  updated_at: string
}

// ============================================================================
// Conversation Types
// ============================================================================

export type AgenticPatternType = 'reflection' | 'tool_use' | 'react' | 'planning' | 'multi_agent'

export interface Conversation {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  pattern: AgenticPatternType
  is_favorite: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
  last_message_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: any
  created_at: string
}

// ============================================================================
// Organization Types
// ============================================================================

export interface Folder {
  id: string
  user_id: string
  name: string
  color: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
}

export interface ConversationTag {
  conversation_id: string
  tag_id: string
  created_at: string
}