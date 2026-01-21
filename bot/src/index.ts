import 'dotenv/config';
import { bot } from './bot';
import { initializeDatabase } from './database/init';
import { messageHandler } from './handlers/message.handler';
import { commandHandler } from './handlers/command.handler';

async function start() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully.');

        commandHandler(bot);
        bot.on('text', messageHandler);

        bot.launch(() => {
            console.log('Bot started successfully');
        });

        // Graceful shutdown
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));

    } catch (error) {
        console.error('Failed to start the bot:', error);
        process.exit(1);
    }
}

start();
