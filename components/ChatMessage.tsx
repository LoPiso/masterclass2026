// src/components/ChatMessage.tsx

import React from 'react';
import ReactMarkdown from 'react-markdown'; // 1. Importa ReactMarkdown
import { Message, MessageRole } from '../types';
import BotIcon from './icons/BotIcon';
import UserIcon from './icons/UserIcon';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === MessageRole.USER;

    const containerClasses = isUser ? 'flex justify-end' : 'flex justify-start';
    const bubbleClasses = isUser
        ? 'bg-[#0096D8] text-white rounded-br-none'
        : 'bg-gray-200 text-gray-800 rounded-bl-none';

    return (
        <div className={`${containerClasses} items-start space-x-3 max-w-xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BotIcon className="w-5 h-5 text-blue-600"/>
                </div>
            )}
            <div
                // 2. Abbiamo rimosso lo stile 'white-space' perché ReactMarkdown lo gestisce.
                className={`p-3 rounded-xl break-words ${bubbleClasses}`}
            >
                {/* 3. Qui sta la modifica principale: */}
                {/* Usiamo ReactMarkdown per interpretare il testo e le classi "prose" per lo stile. */}
                <div className="prose prose-sm max-w-none prose-p:my-0 prose-ul:my-2 prose-ol:my-2 text-inherit">
                    <ReactMarkdown>
                        {message.content}
                    </ReactMarkdown>
                </div>
            </div>
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600"/>
                </div>
            )}
        </div>
    );
};

export default ChatMessage;