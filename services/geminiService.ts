import { AgenticPattern, LogEntry } from '../types';
import { GlobalSettings, AllPatternSettings } from '../settings';

type StreamCallback = (entry: LogEntry) => void;

const API_URL = 'http://localhost:3001';

export const runAgenticPattern = async (
    pattern: AgenticPattern,
    prompt: string,
    streamCallback: StreamCallback,
    globalSettings: GlobalSettings,
    patternSettings: AllPatternSettings
): Promise<void> => {
    const payload = {
        pattern,
        prompt,
        globalSettings,
        patternSettings,
    };
    const encodedPayload = encodeURIComponent(JSON.stringify(payload));
    const eventSource = new EventSource(`${API_URL}/api/run-pattern?payload=${encodedPayload}`);

    eventSource.onmessage = (event) => {
        const entry = JSON.parse(event.data);
        streamCallback(entry);
    };

    eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        streamCallback({
            id: 'error',
            type: 'error',
            content: 'An error occurred while connecting to the server.',
        });
        eventSource.close();
    };
};

export const getConversations = async () => {
    const response = await fetch(`${API_URL}/api/conversations`);
    return response.json();
};

export const getConversation = async (id: string) => {
    const response = await fetch(`${API_URL}/api/conversations/${id}`);
    return response.json();
};
