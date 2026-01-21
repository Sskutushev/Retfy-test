// Type definitions for the web application.
// This mirrors the types from the bot for consistency.

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
