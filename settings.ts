import { AgenticPattern } from './types';

export interface GlobalSettings {
  theme: 'light' | 'dark';
  temperature: number;
  topK: number;
  topP: number;
}

export interface ReflectionSettings {
  refinementPrompt: string;
}

export interface ReActSettings {
  maxIterations: number;
  systemInstruction: string;
}

export interface PlanningSettings {
  planningPrompt: string;
  executionPrompt: string;
}

export interface MultiAgentSettings {
  maxIterations: number;
  coderSystemInstruction: string;
  reviewerSystemInstruction: string;
}

export type AllPatternSettings = {
  [AgenticPattern.Reflection]: ReflectionSettings;
  [AgenticPattern.ToolUse]: {};
  [AgenticPattern.ReAct]: ReActSettings;
  [AgenticPattern.Planning]: PlanningSettings;
  [AgenticPattern.MultiAgent]: MultiAgentSettings;
};

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  theme: 'dark',
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
};

export const DEFAULT_PATTERN_SETTINGS: AllPatternSettings = {
  [AgenticPattern.Reflection]: {
    refinementPrompt: `You are an expert critic. Review the following prompt and the response.
Identify any flaws, omissions, or areas for improvement. Then, provide a final, improved version.

Original Prompt: "{prompt}"

Initial Response:
---
{initialResponse}
---

Your reflection and final, improved response:`,
  },
  [AgenticPattern.ToolUse]: {},
  [AgenticPattern.ReAct]: {
    maxIterations: 3,
    systemInstruction: `You are a helpful assistant that solves problems by breaking them down into a sequence of Thought-Action-Observation. Your goal is to answer the user's request.

You have two actions available:
1.  \`googleSearch(query: string)\`: Use this to find current information or data from the web.
2.  \`finish(answer: string)\`: Use this when you have enough information to provide the final answer to the user.

You must respond with a JSON object containing "thought" and "action". The action string must be either a \`googleSearch\` call or a \`finish\` call.

Example:
User: What is the weather in London?
You:
\`\`\`json
{
  "thought": "I need to find the current weather in London. I will use Google Search.",
  "action": "googleSearch(\\"weather in London\\")"
}
\`\`\`
`,
  },
  [AgenticPattern.Planning]: {
    planningPrompt: `Create a step-by-step plan to address the following request. Do not execute the plan, just create it. Request: "{prompt}"`,
    executionPrompt: `Given the following plan, provide a comprehensive response that fulfills all the steps.
Plan:
{plan}

User's original request: "{prompt}"

Now, execute the plan and provide the final result.`,
  },
  [AgenticPattern.MultiAgent]: {
    maxIterations: 3,
    coderSystemInstruction: `You are a proficient software developer. Write clean, efficient code to meet the user's request. Provide only the code in a markdown block. When revising, incorporate the feedback provided fully and provide the complete, updated code.`,
    reviewerSystemInstruction: `You are a senior code reviewer. Your job is to critique the code provided.
If the code is good and meets the requirements, respond with a JSON object: \`{"approved": true, "comment": "The code looks great!"}\`.
If the code has issues, provide constructive feedback in a JSON object: \`{"approved": false, "comment": "Your detailed feedback here..."}\`.
Do not write code yourself. Only provide the JSON response.`,
  },
};
