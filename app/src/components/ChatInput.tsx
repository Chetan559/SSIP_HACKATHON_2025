import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const ChatInput: React.FC = () => {
  const { sendMessage, isLoading } = useChat();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the input when component mounts
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (input.trim() && !isLoading) {
      await sendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-t bg-gray-50 p-4">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <textarea
          ref={inputRef}
          className="chat-input resize-none"
          placeholder="Type your message..."
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          className="bg-gov-blue hover:bg-gov-navy transition-colors rounded-full p-3 h-auto w-auto"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
