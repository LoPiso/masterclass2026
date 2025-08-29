
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Message, MessageRole } from './types';
import { SYSTEM_INSTRUCTION } from './constants';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const App: React.FC = () => {
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const initializeChat = () => {
            try {
                if (!import.meta.env.API_KEY) {
                    throw new Error("API_KEY non trovata. Assicurati che sia impostata nelle variabili d'ambiente.");
                }
                const ai = new GoogleGenAI({ apiKey: import.meta.env.API_KEY });
                const chat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: SYSTEM_INSTRUCTION,
                    },
                });
                chatRef.current = chat;
            } catch (e) {
                const error = e as Error;
                setError(error.message);
                console.error("Initialization error:", error);
            }
        };
        initializeChat();
    }, []);

    const handleSendMessage = useCallback(async (userInput: string) => {
        if (isLoading || !userInput.trim() || !chatRef.current) return;

        const newUserMessage: Message = { role: MessageRole.USER, content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        setError(null);
        
        // Add a placeholder for the model's response
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
