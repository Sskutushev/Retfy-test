import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { analyzeUserOnWeb } from '@/lib/gemini';
import { Message, User } from '@/lib/types';

// Helper to map DB row to User object
const mapToUser = (row: any): User => ({
    id: row.id,
    telegramId: Number(row.telegram_id),
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
});

// Helper to map DB row to Message object
const mapToMessage = (row: any): Message => ({
    id: row.id,
    userId: Number(row.user_id),
    chatId: Number(row.chat_id),
    messageText: row.message_text,
    messageDate: row.message_date,
    createdAt: row.created_at,
});


export async function POST(request: Request) {
    try {
        const { username } = await request.json();

        if (!username || typeof username !== 'string') {
            return NextResponse.json({ error: 'Username is required and must be a string.' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // 1. Find the user by username
            const userQuery = 'SELECT * FROM users WHERE username = $1;';
            const userResult = await client.query(userQuery, [username]);

            if (userResult.rows.length === 0) {
                return NextResponse.json({ error: 'User not found in the database. Ensure the user has sent at least one message.' }, { status: 404 });
            }
            const targetUser: User = mapToUser(userResult.rows[0]);

            // 2. Get recent messages for that user
            const messagesQuery = `
                SELECT * FROM messages
                WHERE user_id = $1
                ORDER BY message_date DESC
                LIMIT 100;
            `;
            const messagesResult = await client.query(messagesQuery, [targetUser.telegramId]);
            const messages: Message[] = messagesResult.rows.map(mapToMessage);

            if (messages.length < 10) {
                return NextResponse.json({
                    error: `Not enough data for analysis (minimum 10 messages required, available: ${messages.length}).`
                }, { status: 400 });
            }

            // 3. Call Gemini API for analysis
            const analysis = await analyzeUserOnWeb(messages, targetUser);

            return NextResponse.json({ analysis });

        } catch (dbError: any) {
            console.error('Database or internal API error:', dbError);

            // More specific error handling
            if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
                return NextResponse.json({ error: 'Database connection error. Please try again later.' }, { status: 500 });
            }

            return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Error in POST /api/analyze:', error);

        // Handle JSON parsing errors specifically
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
}
