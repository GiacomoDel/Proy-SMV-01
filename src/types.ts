export type Message = {
    role: string;
    content: { text: string }[];
  };
  
  export type Conversation = Message[];
  
  export type ChatSession = {
    id: string;
    title: string;
    conversation: Conversation;
  };
  