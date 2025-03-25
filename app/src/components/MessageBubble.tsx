import React from "react";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? "bg-gov-blue text-white" : "bg-gray-100 text-gray-600"}`}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className="flex flex-col">
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? "bg-gov-blue text-white rounded-tr-sm"
                : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>

          <span
            className={`text-xs text-gray-500 mt-1 ${
              isUser ? "text-right" : ""
            }`}
          >
            {format(new Date(message.timestamp), "h:mm a")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
