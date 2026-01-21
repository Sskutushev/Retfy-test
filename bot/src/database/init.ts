import { pool } from './connection';

/**
 * Initializes the database tables if they don't exist.
 */
export async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(telegram_id),
        chat_id BIGINT NOT NULL,
        message_text TEXT,
        message_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_user_date 
      ON messages(user_id, message_date);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat_date 
      ON messages(chat_id, message_date);
    `);

    console.log('Database tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
}