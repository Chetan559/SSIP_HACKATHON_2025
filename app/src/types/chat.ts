export type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
};

export type ChatSession = {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messages: Message[];
};
