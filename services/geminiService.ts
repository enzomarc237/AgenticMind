
import { GoogleGenAI, Type, Chat, GenerateContentResponse, Content } from "@google/genai";
import { AgenticPattern, LogEntry, GroundingChunk } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

type StreamCallback = (entry: LogEntry) => void;

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const runAgenticPattern = async (
    pattern: AgenticPattern,
    prompt: string,
    streamCallback: StreamCallback,
    maxIterations: number
): Promise<void> => {
    try {
        switch (pattern) {
            case AgenticPattern.Reflection:
                await runReflection(prompt, streamCallback);
                break;
            case AgenticPattern.ToolUse:
                await runToolUse(prompt, streamCallback);
                break;
            case AgenticPattern.ReAct:
                await runReAct(prompt, streamCallback, maxIterations);
                break;
            case AgenticPattern.Planning:
                await runPlanning(prompt, streamCallback);
                break;
            case AgenticPattern.MultiAgent:
                await runMultiAgent(prompt, streamCallback, maxIterations);
                break;
        }
    } catch (error) {
        console.error("Error running agentic pattern:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        streamCallback({ id: generateId(), type: 'error', content: `Failed to execute pattern: ${errorMessage}` });
    }
};

const runReflection = async (prompt: string, cb: StreamCallback) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting Reflection pattern...`, pattern: AgenticPattern.Reflection });

    // Step 1: Initial Generation
    cb({ id: generateId(), type: 'system', content: `Generating initial response...`, pattern: AgenticPattern.Reflection });
    const initialResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    const initialResponse = initialResult.text;
    cb({ id: generateId(), type: 'ai', content: `Initial Draft:\n\n${initialResponse}` });

    // Step 2: Reflection and Refinement
    cb({ id: generateId(), type: 'system', content: `Reflecting on the draft and refining...`, pattern: AgenticPattern.Reflection });
    const reflectionPrompt = `
      You are an expert critic. Review the following prompt and the response.
      Identify any flaws, omissions, or areas for improvement. Then, provide a final, improved version.
      
      Original Prompt: "${prompt}"
      
      Initial Response:
      ---
      ${initialResponse}
      ---
      
      Your reflection and final, improved response:
    `;

    const streamingResult = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: reflectionPrompt
    });
    
    let finalContent = '';
    for await (const chunk of streamingResult) {
        finalContent += chunk.text;
        cb({ id: generateId(), type: 'ai', content: `Refined Output (streaming):\n\n${finalContent}` });
    }
};

const runToolUse = async (prompt: string, cb: StreamCallback) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting Tool Use pattern with Google Search...`, pattern: AgenticPattern.ToolUse });
    cb({ id: generateId(), type: 'tool-call', toolName: 'Google Search', input: prompt });

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    const sources: GroundingChunk[] = groundingMetadata?.groundingChunks || [];
    
    cb({ id: generateId(), type: 'tool-result', toolName: 'Google Search', output: result.text, sources });
};

const runReAct = async (prompt: string, cb: StreamCallback, maxIterations: number) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting ReAct pattern with a max of ${maxIterations} loops...`, pattern: AgenticPattern.ReAct });

    const systemInstruction = `You are a helpful assistant that solves problems by breaking them down into a sequence of Thought-Action-Observation. Your goal is to answer the user's request.

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
`;

    let history: Content[] = [
        { role: 'user', parts: [{ text: prompt }] }
    ];

    for (let i = 0; i < maxIterations; i++) {
        cb({ id: generateId(), type: 'system', content: `Iteration ${i + 1} of ${maxIterations}...`, pattern: AgenticPattern.ReAct });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        thought: { type: Type.STRING },
                        action: { type: Type.STRING }
                    },
                    required: ['thought', 'action']
                }
            }
        });

        let responseJson;
        try {
            responseJson = JSON.parse(response.text);
        } catch(e) {
            cb({ id: generateId(), type: 'error', content: `Model returned invalid JSON. Attempting to recover. Response: ${response.text}` });
            history.push({ role: 'model', parts: [{ text: response.text }]});
            history.push({ role: 'user', parts: [{text: `Observation (Error): Your response was not valid JSON. Please provide a valid JSON object with "thought" and "action" keys.`}]});
            continue;
        }

        const { thought, action } = responseJson;

        cb({ id: generateId(), type: 'thought', content: thought });
        history.push({ role: 'model', parts: [{ text: response.text }] });

        const finishMatch = action.match(/^finish\("?(.*?)"?\)$/s);
        const searchMatch = action.match(/^googleSearch\("?(.*?)"?\)$/s);
        
        if (finishMatch) {
            const finalAnswer = finishMatch[1];
            cb({ id: generateId(), type: 'ai', content: `**Final Answer:**\n\n${finalAnswer}` });
            return;
        }

        if (searchMatch) {
            const query = searchMatch[1];
            cb({ id: generateId(), type: 'tool-call', toolName: 'Google Search', input: query });

            try {
                const searchResult = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: query,
                    config: { tools: [{ googleSearch: {} }] }
                });

                const observation = searchResult.text;
                const sources = searchResult.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                cb({ id: generateId(), type: 'tool-result', toolName: 'Google Search', output: observation, sources });
                history.push({ role: 'user', parts: [{ text: `Observation: ${observation}` }] });
            } catch (toolError) {
                const errorMessage = toolError instanceof Error ? toolError.message : "Unknown tool error";
                cb({ id: generateId(), type: 'error', content: `Google Search tool failed: ${errorMessage}` });
                history.push({ role: 'user', parts: [{ text: `Observation (Error): ${errorMessage}` }] });
            }
        } else {
             cb({ id: generateId(), type: 'error', content: `Unknown or malformed action: ${action}` });
             history.push({ role: 'user', parts: [{ text: `Observation (Error): The action '${action}' is not valid. Please use googleSearch("query") or finish("answer").` }] });
        }
    }
    
    cb({ id: generateId(), type: 'system', content: `Maximum iterations reached. Stopping ReAct loop.`, pattern: AgenticPattern.ReAct });
};


const runPlanning = async (prompt: string, cb: StreamCallback) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting Planning pattern...`, pattern: AgenticPattern.Planning });

    // Step 1: Generate Plan
    const planPrompt = `Create a step-by-step plan to address the following request. Do not execute the plan, just create it. Request: "${prompt}"`;
    const planResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: planPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    plan: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    const { plan } = JSON.parse(planResult.text);
    cb({ id: generateId(), type: 'plan', steps: plan, completedSteps: [] });

    // Step 2: Execute Plan
    cb({ id: generateId(), type: 'system', content: `Executing the plan...`, pattern: AgenticPattern.Planning });
    const executionPrompt = `
      Given the following plan, provide a comprehensive response that fulfills all the steps.
      Plan:
      ${plan.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}
      
      User's original request: "${prompt}"
      
      Now, execute the plan and provide the final result.
    `;
    const executionResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: executionPrompt,
    });
    cb({ id: generateId(), type: 'ai', content: executionResult.text });
};

const runMultiAgent = async (prompt: string, cb: StreamCallback, maxIterations: number) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting Multi-Agent Collaboration with a max of ${maxIterations} review rounds...`, pattern: AgenticPattern.MultiAgent });

    const agents = {
        Coder: {
            name: 'Coder Agent',
            systemInstruction: 'You are a proficient software developer. Write clean, efficient code to meet the user\'s request. Provide only the code in a markdown block. When revising, incorporate the feedback provided fully and provide the complete, updated code.'
        },
        Reviewer: {
            name: 'Reviewer Agent',
            systemInstruction: `You are a senior code reviewer. Your job is to critique the code provided. 
If the code is good and meets the requirements, respond with a JSON object: \`{"approved": true, "comment": "The code looks great!"}\`.
If the code has issues, provide constructive feedback in a JSON object: \`{"approved": false, "comment": "Your detailed feedback here..."}\`.
Do not write code yourself. Only provide the JSON response.`
        }
    };

    const coderChat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: agents.Coder.systemInstruction }
    });

    const reviewerChat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: agents.Reviewer.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    approved: { type: Type.BOOLEAN },
                    comment: { type: Type.STRING }
                },
                required: ['approved', 'comment']
            }
        }
    });

    // Turn 1: Coder writes initial code
    cb({ id: generateId(), type: 'system', content: `Coder Agent is generating the initial code...`, pattern: AgenticPattern.MultiAgent });
    let coderResponse: GenerateContentResponse = await coderChat.sendMessage({ message: prompt });
    let currentCode = coderResponse.text;
    cb({ id: generateId(), type: 'agent-message', agentName: agents.Coder.name, content: currentCode });

    for (let i = 0; i < maxIterations; i++) {
        cb({ id: generateId(), type: 'system', content: `Review round ${i + 1} of ${maxIterations}...`, pattern: AgenticPattern.MultiAgent });
        
        // Turn 2: Reviewer critiques code
        cb({ id: generateId(), type: 'system', content: `Reviewer Agent is critiquing the code...`, pattern: AgenticPattern.MultiAgent });
        let reviewerResponse: GenerateContentResponse;
        try {
            reviewerResponse = await reviewerChat.sendMessage({ message: `Review this code:\n${currentCode}` });
        } catch (e) {
            cb({ id: generateId(), type: 'error', content: `Reviewer agent failed to respond with valid JSON. Stopping collaboration.` });
            return;
        }
        
        const review = JSON.parse(reviewerResponse.text);
        cb({ id: generateId(), type: 'agent-message', agentName: agents.Reviewer.name, content: review.comment });
        
        if (review.approved) {
            cb({ id: generateId(), type: 'system', content: 'Reviewer approved the code. Process complete.', pattern: AgenticPattern.MultiAgent });
            return;
        }

        if (i === maxIterations - 1) {
            // Last iteration and not approved, so we break here before the next Coder step.
            break;
        }

        // Turn 3: Coder revises code
        cb({ id: generateId(), type: 'system', content: `Coder Agent is revising based on feedback...`, pattern: AgenticPattern.MultiAgent });
        coderResponse = await coderChat.sendMessage({ message: `Incorporate this feedback into the original code. Provide the complete, revised code.\n\nFeedback:\n${review.comment}` });
        currentCode = coderResponse.text;
        cb({ id: generateId(), type: 'agent-message', agentName: agents.Coder.name, content: `**Revised Code:**\n${currentCode}` });
    }
    
    cb({ id: generateId(), type: 'system', content: 'Maximum review rounds reached. Stopping multi-agent collaboration.', pattern: AgenticPattern.MultiAgent });
};
