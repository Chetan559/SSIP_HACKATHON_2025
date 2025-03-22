
import React from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={cn(
      "flex mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        isUser ? "message-bubble-user" : "message-bubble-bot"
      )}>
        <div className="flex flex-col">
          <div className="whitespace-pre-wrap">{message.content}</div>
          <div className={cn(
            "text-xs mt-1",
            isUser ? "text-blue-100" : "text-gray-400"
          )}>
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
