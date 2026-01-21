export interface User {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

export interface Message {
  id: number;
  userId: number;
  chatId: number;
  messageText: string;
  messageDate: Date;
  createdAt: Date;
}

export interface TopUserStats {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  messageCount: number;
}

export interface UserStats {
  messageCount: number;
  avgMessageLength: number;
  firstMessage: Date;
  lastMessage: Date;
}

export interface ChatStats {
  totalMessages: number;
  uniqueUsers: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface WordCount {
    word: string;
    count: number;
}
