import { GoogleGenAI, Type, Chat, GenerateContentResponse, Content } from "@google/genai";
import { AgenticPattern, LogEntry, GroundingChunk } from '../types';
import { GlobalSettings, AllPatternSettings } from '../settings';

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
    globalSettings: GlobalSettings,
    patternSettings: AllPatternSettings
): Promise<void> => {
    try {
        const commonConfig = {
            temperature: globalSettings.temperature,
            topK: globalSettings.topK,
            topP: globalSettings.topP,
        };

        switch (pattern) {
            case AgenticPattern.Reflection:
                await runReflection(prompt, streamCallback, commonConfig, patternSettings.Reflection);
                break;
            case AgenticPattern.ToolUse:
                await runToolUse(prompt, streamCallback, commonConfig);
                break;
            case AgenticPattern.ReAct:
                await runReAct(prompt, streamCallback, commonConfig, patternSettings.ReAct);
                break;
            case AgenticPattern.Planning:
                await runPlanning(prompt, streamCallback, commonConfig, patternSettings.Planning);
                break;
            case AgenticPattern.MultiAgent:
                await runMultiAgent(prompt, streamCallback, commonConfig, patternSettings.MultiAgent);
                break;
        }
    } catch (error) {
        console.error("Error running agentic pattern:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        streamCallback({ id: generateId(), type: 'error', content: `Failed to execute pattern: ${errorMessage}` });
    }
};

const runReflection = async (prompt: string, cb: StreamCallback, config: any, settings: AllPatternSettings['Reflection']) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting Reflection pattern...`, pattern: AgenticPattern.Reflection });

    cb({ id: generateId(), type: 'system', content: `Generating initial response...`, pattern: AgenticPattern.Reflection });
    const initialResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config,
    });
    const initialResponse = initialResult.text;
    cb({ id: generateId(), type: 'ai', content: `Initial Draft:\n\n${initialResponse}` });

    cb({ id: generateId(), type: 'system', content: `Reflecting on the draft and refining...`, pattern: AgenticPattern.Reflection });
    const reflectionPrompt = settings.refinementPrompt
        .replace('{prompt}', prompt)
        .replace('{initialResponse}', initialResponse);

    const streamingResult = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: reflectionPrompt,
        config
    });
    
    let finalContent = '';
    for await (const chunk of streamingResult) {
        finalContent += chunk.text;
        cb({ id: generateId(), type: 'ai', content: `Refined Output (streaming):\n\n${finalContent}` });
    }
};

const runToolUse = async (prompt: string, cb: StreamCallback, config: any) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting Tool Use pattern with Google Search...`, pattern: AgenticPattern.ToolUse });
    cb({ id: generateId(), type: 'tool-call', toolName: 'Google Search', input: prompt });

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { ...config, tools: [{ googleSearch: {} }] }
    });
    
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    const sources: GroundingChunk[] = groundingMetadata?.groundingChunks || [];
    
    cb({ id: generateId(), type: 'tool-result', toolName: 'Google Search', output: result.text, sources });
};

const runReAct = async (prompt: string, cb: StreamCallback, config: any, settings: AllPatternSettings['ReAct']) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting ReAct pattern with a max of ${settings.maxIterations} loops...`, pattern: AgenticPattern.ReAct });

    let history: Content[] = [
        { role: 'user', parts: [{ text: prompt }] }
    ];

    for (let i = 0; i < settings.maxIterations; i++) {
        cb({ id: generateId(), type: 'system', content: `Iteration ${i + 1} of ${settings.maxIterations}...`, pattern: AgenticPattern.ReAct });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: {
                ...config,
                systemInstruction: settings.systemInstruction,
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
                    config: { ...config, tools: [{ googleSearch: {} }] }
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


const runPlanning = async (prompt: string, cb: StreamCallback, config: any, settings: AllPatternSettings['Planning']) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting Planning pattern...`, pattern: AgenticPattern.Planning });

    const planPrompt = settings.planningPrompt.replace('{prompt}', prompt);
    const planResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: planPrompt,
        config: {
            ...config,
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

    cb({ id: generateId(), type: 'system', content: `Executing the plan...`, pattern: AgenticPattern.Planning });
    const planString = plan.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n');
    const executionPrompt = settings.executionPrompt
        .replace('{plan}', planString)
        .replace('{prompt}', prompt);

    const executionResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: executionPrompt,
        config,
    });
    cb({ id: generateId(), type: 'ai', content: executionResult.text });
};

const runMultiAgent = async (prompt: string, cb: StreamCallback, config: any, settings: AllPatternSettings['MultiAgent']) => {
    const ai = getAI();
    cb({ id: generateId(), type: 'system', content: `Starting Multi-Agent Collaboration with a max of ${settings.maxIterations} review rounds...`, pattern: AgenticPattern.MultiAgent });

    const agents = {
        Coder: {
            name: 'Coder Agent',
            systemInstruction: settings.coderSystemInstruction
        },
        Reviewer: {
            name: 'Reviewer Agent',
            systemInstruction: settings.reviewerSystemInstruction
        }
    };

    const coderChat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { ...config, systemInstruction: agents.Coder.systemInstruction }
    });

    const reviewerChat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            ...config,
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

    cb({ id: generateId(), type: 'system', content: `Coder Agent is generating the initial code...`, pattern: AgenticPattern.MultiAgent });
    let coderResponse: GenerateContentResponse = await coderChat.sendMessage({ message: prompt });
    let currentCode = coderResponse.text;
    cb({ id: generateId(), type: 'agent-message', agentName: agents.Coder.name, content: currentCode });

    for (let i = 0; i < settings.maxIterations; i++) {
        cb({ id: generateId(), type: 'system', content: `Review round ${i + 1} of ${settings.maxIterations}...`, pattern: AgenticPattern.MultiAgent });
        
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

        if (i === settings.maxIterations - 1) {
            break;
        }

        cb({ id: generateId(), type: 'system', content: `Coder Agent is revising based on feedback...`, pattern: AgenticPattern.MultiAgent });
        coderResponse = await coderChat.sendMessage({ message: `Incorporate this feedback into the original code. Provide the complete, revised code.\n\nFeedback:\n${review.comment}` });
        currentCode = coderResponse.text;
        cb({ id: generateId(), type: 'agent-message', agentName: agents.Coder.name, content: `**Revised Code:**\n${currentCode}` });
    }
    
    cb({ id: generateId(), type: 'system', content: 'Maximum review rounds reached. Stopping multi-agent collaboration.', pattern: AgenticPattern.MultiAgent });
};
