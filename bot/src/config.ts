import 'dotenv/config';

export const config = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    postgres: {
        host: process.env.POSTGRES_HOST || 'postgres',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DB || 'telegram_analytics',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
    },
    redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '1200', 10),
    }
};

// Don't throw errors during testing
if (process.env.NODE_ENV !== 'test') {
    if (!config.telegramBotToken) {
        throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
    }
    if (!config.geminiApiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
}
