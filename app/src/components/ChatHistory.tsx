import React from "react";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ChatHistory: React.FC = () => {
  const { sessions, currentSession, createNewSession, selectSession } =
    useChat();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b">
        <Button
          onClick={createNewSession}
          variant="outline"
          className="w-full bg-white hover:bg-gray-50 flex gap-2 items-center justify-center"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No chat history yet
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => selectSession(session.id)}
              className={cn(
                "w-full px-4 py-3 text-left flex flex-col gap-1 hover:bg-gray-100 transition-colors",
                currentSession?.id === session.id ? "bg-gray-100" : ""
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gov-blue flex-shrink-0" />
                <span className="font-medium truncate">{session.title}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate pl-6">
                {session.lastMessage}
              </div>
              <div className="text-xs text-muted-foreground pl-6">
                {format(session.updatedAt, "MMM d, h:mm a")}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
