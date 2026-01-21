import { Telegraf } from 'telegraf';
import { config } from './config';

export const bot = new Telegraf(config.telegramBotToken);

bot.start((ctx) => ctx.reply('Welcome to the Chat Analytics Bot!'));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
