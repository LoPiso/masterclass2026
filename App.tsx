import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Message, MessageRole } from './types';
import { SYSTEM_INSTRUCTION } from './constants';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const ApiKeySetup: React.FC<{ onApiKeySubmit: (key: string) => void; error: string | null }> = ({ onApiKeySubmit, error }) => {
    const [apiKeyInput, setApiKeyInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKeyInput.trim()) {
            onApiKeySubmit(apiKeyInput.trim());
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6">
            <div className="w-full max-w-md text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Configurazione Assistente Virtuale</h2>
                <p className="text-gray-600 mb-6">Per iniziare, inserisci la tua chiave API di Google AI Studio.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Incolla la tua API Key qui"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="API Key Input"
                    />
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={!apiKeyInput.trim()}
                        className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors"
                    >
                        Avvia Chat
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-4">
                    La tua chiave API è salvata solo nel tuo browser e non viene condivisa.
                </p>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: MessageRole.MODEL,
            content: "Buongiorno! Sono l'assistente virtuale per il Bando Innovazione Digitale 2024. Come posso aiutarla oggi? Ponga pure le sue domande sul bando."
        }
    ]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedApiKey = localStorage.getItem('google-api-key');
        if (storedApiKey) {
            handleApiKeySubmit(storedApiKey);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isInitialized) {
            scrollToBottom();
        }
    }, [messages, isInitialized]);

    const handleApiKeySubmit = useCallback(async (key: string) => {
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: key });
            // Test the key with a simple request to ensure it's valid
            await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: SYSTEM_INSTRUCTION },
            });
            chatRef.current = chat;
            
            localStorage.setItem('google-api-key', key);
            setApiKey(key);
            setIsInitialized(true);
        } catch (e) {
            console.error("Initialization error:", e);
            setError("La chiave API non è valida o si è verificato un errore. Riprova.");
            localStorage.removeItem('google-api-key');
        }
    }, []);

    const handleSendMessage = useCallback(async (userInput: string) => {
        if (isLoading || !userInput.trim() || !chatRef.current) return;

        const newUserMessage: Message = { role: MessageRole.USER, content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        setError(null);
        
        setMessages(prev => [...prev, { role: MessageRole.MODEL, content: "" }]);

        try {
            const result = await chatRef.current.sendMessageStream({ message: userInput });
            
            for await (const chunk of result) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === MessageRole.MODEL) {
                        return [
                            ...prev.slice(0, -1),
                            { ...lastMessage, content: lastMessage.content + chunkText }
                        ];
                    }
                    return prev;
                });
            }
        } catch (e) {
            const error = e as Error;
            const errorMessage = `Si è verificato un errore: ${error.message}`;
            setError(errorMessage);
             setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === MessageRole.MODEL && lastMessage.content === "") {
                        return [
                            ...prev.slice(0, -1),
                            { ...lastMessage, content: "Mi dispiace, non sono riuscito a elaborare la sua richiesta. Riprovi più tardi." }
                        ];
                    }
                    return prev;
                });
            console.error("Send message error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    if (!isInitialized) {
        return (
             <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-2xl rounded-lg my-4 font-sans">
                <ApiKeySetup onApiKeySubmit={handleApiKeySubmit} error={error} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-2xl rounded-lg my-4 font-sans">
            <header className="bg-blue-600 text-white p-4 rounded-t-lg shadow-md">
                <h1 className="text-2xl font-bold">Assistente Bando</h1>
                <p className="text-sm opacity-90">Camera di Commercio - Innovazione Digitale 2024</p>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                ))}
                 {isLoading && messages[messages.length-1].role === MessageRole.MODEL && messages[messages.length-1].content === "" && (
                   <div className="flex justify-start items-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            {error && <div className="p-4 text-center text-red-600 bg-red-100 border-t border-red-200">{error}</div>}
            <footer className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </footer>
        </div>
    );
};

export default App;
