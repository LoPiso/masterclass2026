
import React, { useState } from 'react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const SendIcon: React.FC<{className: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi la tua domanda qui..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0096D8] transition duration-200 disabled:bg-gray-100"
            />
            <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#0096D8] text-white rounded-full p-3 hover:bg-[#007bb5] focus:outline-none focus:ring-2 focus:ring-[#0096D8] focus:ring-offset-2 disabled:bg-[#99d5ed] disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Invia messaggio"
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </form>
    );
};

export default ChatInput;
