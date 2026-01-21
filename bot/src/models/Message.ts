import { pool } from '../database/connection';
import { Message } from '../types';

export class MessageModel {
  /**
   * Creates a new message record.
   * @param messageData 
   * @returns 
   */
  static async create(messageData: {
    userId: number;
    chatId: number;
    messageText: string;
    messageDate: Date;
  }): Promise<Message> {
    const { userId, chatId, messageText, messageDate } = messageData;
    try {
      const query = `
        INSERT INTO messages (user_id, chat_id, message_text, message_date)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [userId, chatId, messageText, messageDate]);
      return this.mapToMessage(rows[0]);
    } catch (error) {
      console.error('Error in MessageModel.create:', error);
      // It's possible the user_id (telegram_id) doesn't exist in the users table yet.
      // The handler should ensure user exists before calling this.
      if (error instanceof Error && 'constraint' in error && error.constraint === 'messages_user_id_fkey') {
          console.error(`Attempted to insert a message for a non-existent user (telegram_id: ${userId}).`);
      }
      throw error;
    }
  }

  /**
   * Gets the most recent messages from a user in any chat.
   * @param userId 
   * @param limit 
   * @returns 
   */
  static async getRecentByUser(
    userId: number,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const query = `
        SELECT * FROM messages
        WHERE user_id = $1
        ORDER BY message_date DESC
        LIMIT $2;
      `;
      const { rows } = await pool.query(query, [userId, limit]);
      return rows.map(this.mapToMessage);
    } catch (error) {
      console.error('Error in MessageModel.getRecentByUser:', error);
      throw error;
    }
  }

  /**
   * Gets all messages from a user within a specific time period.
   * @param userId 
   * @param startDate 
   * @param endDate 
   * @returns 
   */
  static async getByUserAndPeriod(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Message[]> {
    try {
      const query = `
        SELECT * FROM messages
        WHERE user_id = $1
          AND message_date >= $2
          AND message_date <= $3
        ORDER BY message_date DESC;
      `;
      const { rows } = await pool.query(query, [userId, startDate, endDate]);
      return rows.map(this.mapToMessage);
    } catch (error) {
      console.error('Error in MessageModel.getByUserAndPeriod:', error);
      throw error;
    }
  }

  /**
   * Gets the total number of messages in a specific chat.
   * @param chatId
   * @returns 
   */
  static async getTotalCount(chatId: number): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as total FROM messages WHERE chat_id = $1;';
      const { rows } = await pool.query(query, [chatId]);
      return parseInt(rows[0].total, 10);
    } catch (error) {
      console.error('Error in MessageModel.getTotalCount:', error);
      throw error;
    }
  }

  private static mapToMessage(row: any): Message {
      return {
          id: row.id,
          userId: Number(row.user_id),
          chatId: Number(row.chat_id),
          messageText: row.message_text,
          messageDate: row.message_date,
          createdAt: row.created_at,
      };
  }
}
