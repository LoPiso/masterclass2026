
import React from 'react';
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
        ? 'bg-blue-600 text-white rounded-br-none'
        : 'bg-gray-200 text-gray-800 rounded-bl-none';

    return (
        <div className={`${containerClasses} items-start space-x-3 max-w-xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BotIcon className="w-5 h-5 text-blue-600"/>
                </div>
            )}
            <div
                className={`p-3 rounded-xl break-words ${bubbleClasses}`}
                style={{ whiteSpace: 'pre-wrap' }}
            >
                {message.content}
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
