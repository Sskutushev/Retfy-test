import { pool } from '../database/connection';
import { ChatStats, TopUserStats, UserStats } from '../types';

export class StatsService {
    /**
     * Calculates the start date for a given period.
     * @param period 
     * @returns 
     */
    private static getStartDate(period: 'today' | 'week' | 'month' | 'all'): Date {
        const now = new Date();
        if (period === 'today') {
            now.setHours(0, 0, 0, 0);
            return now;
        }
        if (period === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
            return new Date(now.setDate(diff));
        }
        if (period === 'month') {
            return new Date(now.getFullYear(), now.getMonth(), 1);
        }
        // 'all' time
        return new Date(0); 
    }


    /**
     * Gets the top 10 most active users in a chat for a given period.
     * @param chatId 
     * @param period 
     * @returns 
     */
    static async getTopUsers(
        chatId: number,
        period: 'today' | 'week' | 'month' | 'all'
    ): Promise<TopUserStats[]> {
        const startDate = this.getStartDate(period);
        try {
            const query = `
                SELECT
                    u.telegram_id,
                    u.username,
                    u.first_name,
                    u.last_name,
                    COUNT(m.id) as message_count
                FROM users u
                JOIN messages m ON u.telegram_id = m.user_id
                WHERE m.chat_id = $1 AND m.message_date >= $2
                GROUP BY u.telegram_id, u.username, u.first_name, u.last_name
                ORDER BY message_count DESC
                LIMIT 10;
            `;
            const { rows } = await pool.query(query, [chatId, startDate]);
            return rows.map(row => ({
                telegramId: Number(row.telegram_id),
                username: row.username,
                firstName: row.first_name,
                lastName: row.last_name,
                messageCount: Number(row.message_count),
            }));
        } catch (error) {
            console.error('Error in StatsService.getTopUsers:', error);
            throw error;
        }
    }

    /**
     * Gets statistics for a specific user in a chat for a given period.
     * @param userId 
     * @param chatId 
     * @param period
     * @returns 
     */
    static async getUserStats(
        userId: number,
        chatId: number,
        period: 'today' | 'week' | 'month' | 'all'
    ): Promise<UserStats | null> {
        const startDate = this.getStartDate(period);
        try {
            const query = `
                SELECT
                    COUNT(id) as message_count,
                    AVG(LENGTH(message_text)) as avg_message_length,
                    MIN(message_date) as first_message,
                    MAX(message_date) as last_message
                FROM messages
                WHERE user_id = $1 AND chat_id = $2 AND message_date >= $3;
            `;
            const { rows } = await pool.query(query, [userId, chatId, startDate]);

            if (rows.length === 0 || rows[0].message_count === '0') {
                return null;
            }

            return {
                messageCount: Number(rows[0].message_count),
                avgMessageLength: parseFloat(rows[0].avg_message_length || '0'),
                firstMessage: new Date(rows[0].first_message),
                lastMessage: new Date(rows[0].last_message),
            };
        } catch (error) {
            console.error('Error in StatsService.getUserStats:', error);
            throw error;
        }
    }

    /**
     * Gets overall statistics for a chat for a given period.
     * @param chatId 
     * @param period 
     * @returns 
     */
    static async getChatStats(
        chatId: number,
        period: 'today' | 'week' | 'month' | 'all'
    ): Promise<ChatStats> {
        const startDate = this.getStartDate(period);
        const endDate = new Date();
        try {
            const query = `
                SELECT
                    COUNT(id) as total_messages,
                    COUNT(DISTINCT user_id) as unique_users
                FROM messages
                WHERE chat_id = $1 AND message_date >= $2;
            `;
            const { rows } = await pool.query(query, [chatId, startDate]);

            return {
                totalMessages: Number(rows[0].total_messages || '0'),
                uniqueUsers: Number(rows[0].unique_users || '0'),
                periodStart: startDate,
                periodEnd: endDate,
            };
        } catch (error) {
            console.error('Error in StatsService.getChatStats:', error);
            throw error;
        }
    }
}
