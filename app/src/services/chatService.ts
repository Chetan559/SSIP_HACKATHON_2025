import api from "./api";
import { ChatSession, Message } from "@/types/chat";

const chatService = {
  // Get all chat sessions for current user
  getSessions: async () => {
    const response = await api.get("/sessions");
    return response.data;
  },

  // Create a new chat session
  createSession: async (title: string) => {
    const response = await api.post("/sessions", { title });
    return response.data;
  },

  // Get messages for a specific session
  getMessages: async (sessionId: string) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Send a message in a chat session
  sendMessage: async (sessionId: string, content: string) => {
    // First try the regular endpoint for sending messages
    try {
      const response = await api.post(`/sessions/${sessionId}/msg`, {
        sender: "user",
        content,
      });
      return response.data;
    } catch (error) {
      // If that fails, try the chat endpoint which is used for simpler implementations
      console.log("Falling back to /chat endpoint");
      const chatResponse = await api.post("/chat", { message: content });
      return chatResponse.data;
    }
  },
};

export default chatService;
