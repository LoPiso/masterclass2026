import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, MessageRole } from './types';
import { SYSTEM_INSTRUCTION, SUGGESTION_SYSTEM_INSTRUCTION } from './personalita';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TrashIcon from './components/icons/TrashIcon';
import LightbulbIcon from './components/icons/LightbulbIcon';
import UploadIcon from './components/icons/UploadIcon';

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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Configurazione Sportello AI</h2>
                <p className="text-gray-600 mb-6">Per iniziare, inserisci la tua chiave API di Google AI Studio.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Incolla la tua API Key qui"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0096D8]"
                        aria-label="API Key Input"
                    />
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={!apiKeyInput.trim()}
                        className="w-full bg-[#0096D8] text-white rounded-lg py-2.5 font-semibold hover:bg-[#007bb5] focus:outline-none focus:ring-2 focus:ring-[#0096D8] focus:ring-offset-2 disabled:bg-[#99d5ed] transition-colors"
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const initialWelcomeMessage = {
        role: MessageRole.MODEL,
        content: "Sono qui per aiutarti a capire in cosa consiste l'agevolazione, come funziona la procedura e come può esserti utile. Ma partiamo da te: che impresa sei? Che esigenza hai?"
    };

    const initialSuggestions = [
        "A quali imprese si rivolge?",
        "Quali servizi offre?",
        "A cosa mi serve?",
        "Che impegno mi richiede?"
    ];
    
    const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);

    // Check for API key on initial load
    useEffect(() => {
        const storedApiKey = localStorage.getItem('google-api-key');
        if (storedApiKey) {
            handleApiKeySubmit(storedApiKey);
        } else {
            setMessages([initialWelcomeMessage]);
        }
    }, []);

    // Load chat history once the API is initialized
    useEffect(() => {
        if (isInitialized) {
            try {
                const savedMessages = localStorage.getItem('chat-history');
                if (savedMessages) {
                    const parsedMessages = JSON.parse(savedMessages);
                    if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                        setMessages(parsedMessages);
                    } else {
                        setMessages([initialWelcomeMessage]);
                    }
                } else {
                     setMessages([initialWelcomeMessage]);
                }
            } catch (e) {
                console.error("Failed to load chat history:", e);
                setMessages([initialWelcomeMessage]);
            }
        }
    }, [isInitialized]);

    // Save chat history whenever messages change
    useEffect(() => {
        if (isInitialized && messages.length > 0) {
            const messagesToSave = messages.filter(msg => msg.content.trim() !== '');
             if (messagesToSave.length > 0) {
                localStorage.setItem('chat-history', JSON.stringify(messagesToSave));
            }
        }
    }, [messages, isInitialized]);

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
            if (!navigator.onLine || (e instanceof TypeError && e.message.includes('Failed to fetch'))) {
                setError("Connessione di rete assente. Impossibile verificare la chiave API.");
            } else {
                setError("La chiave API non è valida o si è verificato un errore. Riprova.");
            }
            localStorage.removeItem('google-api-key');
        }
    }, []);

    const updateDynamicSuggestions = useCallback(async () => {
        if (!apiKey || messages.length <= 1) return;

        try {
            const ai = new GoogleGenAI({ apiKey });
            const chatHistory = messages.slice(1).map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: chatHistory,
                config: {
                    systemInstruction: SUGGESTION_SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });

            const jsonText = response.text.trim();
            const newSuggestions = JSON.parse(jsonText);
            
            if (Array.isArray(newSuggestions) && newSuggestions.length > 0) {
                setSuggestions(newSuggestions);
            }

        } catch (e) {
            console.error("Failed to update dynamic suggestions:", e);
            // In caso di errore, non cambiamo i suggerimenti attuali
        }
    }, [apiKey, messages]);

    useEffect(() => {
        if (!isLoading && messages.length > 1 && messages[messages.length - 1].role === MessageRole.MODEL) {
            updateDynamicSuggestions();
        }
    }, [isLoading, messages, updateDynamicSuggestions]);

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
            let errorMessage: string;
            if (!navigator.onLine || (e instanceof TypeError && e.message.includes('Failed to fetch'))) {
                errorMessage = "Connessione di rete assente. Controlla la tua connessione e riprova.";
            } else {
                errorMessage = `Si è verificato un errore: ${error.message}`;
            }

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

    const handleClearChat = useCallback(() => {
        if (!apiKey) return;
        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: SYSTEM_INSTRUCTION },
            });
            chatRef.current = newChat;

            setMessages([initialWelcomeMessage]);
            setSuggestions(initialSuggestions);
            localStorage.removeItem('chat-history');
            setError(null);
        } catch (e) {
            console.error("Failed to clear chat:", e);
            setError("Impossibile riavviare la chat. Ricarica la pagina.");
        }
    }, [apiKey, initialWelcomeMessage]);

    if (!isInitialized) {
        return (
             <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-2xl rounded-lg my-4 font-sans">
                <ApiKeySetup onApiKeySubmit={handleApiKeySubmit} error={error} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-2xl rounded-lg my-4 font-sans">
            <header className="bg-[#0096D8] text-white p-4 rounded-t-lg shadow-md flex items-center">
                <div>
                    <h1 className="text-xl font-bold" style={{fontFamily: 'Futura, "Century Gothic", sans-serif'}}>Sportello AI</h1>
                    <p className="text-sm opacity-90">Bando Masterclass PID 2026</p>
                </div>
            </header>
            
            <div className="flex items-center space-x-2 p-2 border-b border-gray-200 bg-gray-50">
                <button 
                    onClick={handleClearChat} 
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0096D8] transition-colors"
                    aria-label="Cancella cronologia chat"
                    title="Cancella cronologia chat"
                >
                    <TrashIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">Cancella</span>
                </button>
                <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0096D8] transition-colors"
                    aria-label="Mostra suggerimenti"
                    title="Mostra suggerimenti"
                >
                    <LightbulbIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">Suggerimenti</span>
                </button>
                <a
                  href="https://forms.office.com/Pages/ResponsePage.aspx?id=wdFmYyKD6Uub8uowsPk3pRB4TRr5nQJIgT2lBUC6ZudUM1NSQkRaTENWWUpJSEcyRDhLVFdGMVZaNy4u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0096D8] transition-colors"
                  aria-label="Applica per il bando"
                  title="Applica per il bando"
                >
                  <UploadIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">Applica</span>
                </a>
            </div>

            {showSuggestions && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Prova a chiedere:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    handleSendMessage(q);
                                    setShowSuggestions(false);
                                }}
                                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0096D8]"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                ))}
                 {isLoading && messages[messages.length-1]?.role === MessageRole.MODEL && messages[messages.length-1].content === "" && (
                   <div className="flex justify-start items-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-[#0096D8] rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-[#0096D8] rounded-full animate-pulse [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-[#0096D8] rounded-full animate-pulse [animation-delay:0.4s]"></div>
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