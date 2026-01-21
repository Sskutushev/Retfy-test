import { pool } from '../database/connection';
import { User } from '../types';

export class UserModel {
  /**
   * Finds an existing user or creates a new one.
   * @param userData 
   * @returns 
   */
  static async findOrCreate(userData: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const { telegramId, username, firstName, lastName } = userData;

    try {
      // First, try to find the user
      const existingUser = await this.findByTelegramId(telegramId);
      if (existingUser) {
        // Optional: Update user info if it has changed
        if (
          existingUser.username !== username ||
          existingUser.firstName !== firstName ||
          existingUser.lastName !== lastName
        ) {
          const updateUserQuery = `
            UPDATE users
            SET username = $2, first_name = $3, last_name = $4
            WHERE telegram_id = $1
            RETURNING *;
          `;
          const { rows } = await pool.query(updateUserQuery, [telegramId, username, firstName, lastName]);
          return this.mapToUser(rows[0]);
        }
        return existingUser;
      }

      // If user doesn't exist, create a new one
      const insertQuery = `
        INSERT INTO users (telegram_id, username, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const { rows } = await pool.query(insertQuery, [telegramId, username, firstName, lastName]);
      console.log(`Created new user: ${username || firstName}`);
      return this.mapToUser(rows[0]);

    } catch (error) {
      console.error('Error in UserModel.findOrCreate:', error);
      throw error;
    }
  }

  /**
   * Finds a user by their Telegram ID.
   * @param telegramId 
   * @returns 
   */
  static async findByTelegramId(telegramId: number): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE telegram_id = $1;';
      const { rows } = await pool.query(query, [telegramId]);
      return rows.length > 0 ? this.mapToUser(rows[0]) : null;
    } catch (error) {
      console.error('Error in UserModel.findByTelegramId:', error);
      throw error;
    }
  }

  /**
   * Finds a user by their username.
   * @param username 
   * @returns 
   */
  static async findByUsername(username: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE username = $1;';
      const { rows } = await pool.query(query, [username]);
      return rows.length > 0 ? this.mapToUser(rows[0]) : null;
    } catch (error) {
      console.error('Error in UserModel.findByUsername:', error);
      throw error;
    }
  }

  /**
   * Finds all users who have sent a message in a specific chat.
   * @param chatId 
   * @returns 
   */
  static async findByChatId(chatId: number): Promise<User[]> {
      try {
          const query = `
              SELECT DISTINCT u.*
              FROM users u
              JOIN messages m ON u.telegram_id = m.user_id
              WHERE m.chat_id = $1;
          `;
          const { rows } = await pool.query(query, [chatId]);
          return rows.map(this.mapToUser);
      } catch (error) {
          console.error('Error in UserModel.findByChatId:', error);
          throw error;
      }
  }

  private static mapToUser(row: any): User {
    return {
      id: row.id,
      telegramId: Number(row.telegram_id),
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: row.created_at,
    };
  }
}
