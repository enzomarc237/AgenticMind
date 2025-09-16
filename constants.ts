
import { AgenticPattern } from './types';

export const PATTERN_DESCRIPTIONS: Record<AgenticPattern, { title: string; description: string; promptPlaceholder: string }> = {
  [AgenticPattern.Reflection]: {
    title: 'Reflection: Self-Correction & Refinement',
    description: "The AI critically evaluates its own output and suggests improvements. It's like giving the model a pause button and a mirror to double-check its work, reducing sloppy mistakes.",
    promptPlaceholder: "e.g., Write a Python function to calculate a Fibonacci sequence."
  },
  [AgenticPattern.ToolUse]: {
    title: 'Tool Use: External Data & Actions',
    description: "The AI utilizes external tools, like Google Search, to gather real-world data instead of hallucinating. This allows the agent to pull in real, up-to-date information.",
    promptPlaceholder: "e.g., Who won the most recent F1 world championship?"
  },
  [AgenticPattern.ReAct]: {
    title: 'ReAct: Reasoning + Acting',
    description: "The agent operates in a loop of 'Thought' (reasoning) and 'Action' (tool use or response), allowing it to adapt and course-correct based on intermediate results.",
    promptPlaceholder: "e.g., What is the capital of France and what is its population?"
  },
  [AgenticPattern.Planning]: {
    title: 'Planning: Multi-Step Task Management',
    description: "For complex problems, the AI first generates a detailed plan of sub-tasks before executing. This turns a reactive helper into a proactive one that thinks ahead.",
    promptPlaceholder: "e.g., Outline a plan to launch a new podcast."
  },
  [AgenticPattern.MultiAgent]: {
    title: 'Multi-Agent: Collaborative Problem Solving',
    description: "Multiple AI agents with specific roles (e.g., Coder, Reviewer) collaborate to solve a problem. The magic happens when they disagree, leading to sharper insights.",
    promptPlaceholder: "e.g., Write a simple React component and have a reviewer critique it."
  },
};
