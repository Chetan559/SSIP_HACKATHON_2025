import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from "@/components/Header";
import ChatHistory from "@/components/ChatHistory";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Chat History Sidebar */}
        <div
          className={`
            ${showSidebar ? "block" : "hidden"}
            ${
              isMobile
                ? "absolute z-10 inset-0 bg-white animate-fade-in"
                : "w-80 border-r"
            }
          `}
        >
          {isMobile && (
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
          <ChatHistory />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {isMobile && !showSidebar && (
            <div className="absolute top-16 left-4 z-10">
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => setShowSidebar(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          )}

          <ChatWindow />
          <ChatInput />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
