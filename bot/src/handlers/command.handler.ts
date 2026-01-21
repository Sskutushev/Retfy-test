import { Context, Markup, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { cacheService } from '../services/cache.service';
import { StatsService } from '../services/stats.service';
import { ChatStats, TopUserStats, UserStats, WordCount } from '../types';
import { GeminiService } from '../services/gemini.service';
import { MessageModel } from '../models/Message';
import { UserModel } from '../models/User';
import { WordCloudService } from '../services/wordcloud.service';

type Period = 'today' | 'week' | 'month' | 'all';
const PERIOD_NAMES: Record<Period, string> = {
    today: 'за сегодня',
    week: 'за неделю',
    month: 'за месяц',
    all: 'за всё время'
};

// Keyboards
const statsKeyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback('За сегодня', 'stats_today'),
        Markup.button.callback('За неделю', 'stats_week'),
    ],
    [
        Markup.button.callback('За месяц', 'stats_month'),
        Markup.button.callback('За всё время', 'stats_all'),
    ],
    [Markup.button.callback('Моя статистика', 'stats_me')],
]);

const wordCloudKeyboard = Markup.inlineKeyboard([
    Markup.button.callback('За сегодня', 'wc_today'),
    Markup.button.callback('За неделю', 'wc_week'),
    Markup.button.callback('За месяц', 'wc_month'),
    Markup.button.callback('За всё время', 'wc_all'),
]);


// Services
const geminiService = new GeminiService();

export function commandHandler(bot: Telegraf) {
    // #region /start command
    bot.start((ctx) => ctx.reply('Привет! Я бот для аналитики чата. Я могу собирать статистику и анализировать сообщения.'));
    // #endregion

    // #region /stats command
    bot.command('stats', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.reply('Эта команда работает только в группах.');
        }
        await ctx.reply('Выберите период для статистики:', statsKeyboard);
    });

    bot.action(/stats_(today|week|month|all)/, async (ctx) => {
        const period = ctx.match[1] as Period;
        const chatId = ctx.chat?.id;
        if (!chatId) return ctx.answerCbQuery('Не удалось определить чат.');

        try {
            await ctx.answerCbQuery(`Загружаю статистику ${PERIOD_NAMES[period]}...`);
            const messageText = await generateChatStatsMessage(chatId, period);
            await ctx.editMessageText(messageText, { ...statsKeyboard, parse_mode: 'HTML' });
        } catch (error) {
            console.error(error);
            await ctx.editMessageText('❌ Ошибка при загрузке статистики.');
        }
    });

    bot.action('stats_me', async (ctx) => {
        const chatId = ctx.chat?.id;
        const userId = ctx.from?.id;
        if (!chatId || !userId) return ctx.answerCbQuery('Не удалось определить пользователя или чат.');

        try {
            await ctx.answerCbQuery('Загружаю вашу статистику...');
            const messageText = await generateUserStatsMessage(userId, chatId, ctx.from.first_name || 'Пользователь');
            await ctx.editMessageText(messageText, { ...statsKeyboard, parse_mode: 'HTML' });
        } catch (error) {
            console.error(error);
            await ctx.editMessageText('❌ Ошибка при загрузке вашей статистики.');
        }
    });
    // #endregion

    // #region /analyze command
    bot.command('analyze', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.reply('Эта команда работает только в группах.');
        }

        let targetUser;
        let telegramUserData;
        const repliedTo = (ctx.message as any)?.reply_to_message;
        const commandText = (ctx.message as any).text;
        const match = commandText.match(/@(\w+)/);

        if (match) {
            // First, try to find the user in our database
            targetUser = await UserModel.findByUsername(match[1]);

            // If not found in database, try to get user info from Telegram
            if (!targetUser) {
                try {
                    // Attempt to get user by username from Telegram API
                    const chatMember = await ctx.telegram.getChatMember(ctx.chat.id, parseInt(match[1]));
                    if (chatMember && chatMember.user) {
                        telegramUserData = chatMember.user;
                        // Create or update user in our database
                        targetUser = await UserModel.findOrCreate({
                            telegramId: telegramUserData.id,
                            username: telegramUserData.username,
                            firstName: telegramUserData.first_name,
                            lastName: telegramUserData.last_name
                        });
                    }
                } catch (error) {
                    console.error('Error getting user from Telegram API:', error);
                    return ctx.reply(`Не удалось получить информацию о пользователе @${match[1]} из Telegram.`);
                }
            }
        } else if (repliedTo && repliedTo.from) {
            targetUser = await UserModel.findByTelegramId(repliedTo.from.id);
            telegramUserData = repliedTo.from;

            // If not found in database, create user record
            if (!targetUser) {
                targetUser = await UserModel.findOrCreate({
                    telegramId: telegramUserData.id,
                    username: telegramUserData.username,
                    firstName: telegramUserData.first_name,
                    lastName: telegramUserData.last_name
                });
            }
        } else {
            return ctx.reply('Как использовать: /analyze @username или ответьте на сообщение пользователя командой /analyze.');
        }

        if (!targetUser) {
            return ctx.reply('Пользователь не найден в базе данных и не может быть получен из Telegram.');
        }

        const loadingMessage = await ctx.reply(`Анализирую пользователя ${targetUser.username ? `@${targetUser.username}` : targetUser.firstName || 'Пользователь'}... ⏳`);

        try {
            const messages = await MessageModel.getRecentByUser(targetUser.telegramId, 100);
            if (messages.length < 10) {
                return ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, undefined, `Недостаточно данных для анализа (нужно минимум 10 сообщений, доступно: ${messages.length}).`);
            }

            const analysis = await geminiService.analyzeUser(messages, targetUser);
            const resultText = `🔍 <b>Анализ пользователя ${targetUser.username ? `@${targetUser.username}` : targetUser.firstName || 'Пользователь'}</b>\n\n${analysis}\n\n📊 <i>На основе ${messages.length} сообщений.</i>`;

            await ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, undefined, resultText, { parse_mode: 'HTML' });
        } catch (error) {
            console.error('Error during user analysis:', error);
            let errorMessage = '❌ Произошла ошибка при анализе.';

            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('Gemini') || error.message.toLowerCase().includes('api')) {
                    errorMessage = '❌ Ошибка при обращении к AI-сервису. Пожалуйста, попробуйте позже.';
                } else if (error.message.includes('database') || error.message.toLowerCase().includes('connection')) {
                    errorMessage = '❌ Ошибка подключения к базе данных. Пожалуйста, попробуйте позже.';
                }
            }

            await ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, undefined, errorMessage);
        }
    });
    // #endregion

    // #region /wordcloud command
    bot.command('wordcloud', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.reply('Эта команда работает только в группах.');
        }
        await ctx.reply('Выберите период для генерации облака слов:', {
            reply_markup: wordCloudKeyboard.reply_markup,
        });
    });

    bot.action(/wc_(today|week|month|all)/, async (ctx) => {
        const period = ctx.match[1] as Period;
        const chatId = ctx.chat?.id;
        if (!chatId) return ctx.answerCbQuery('Не удалось определить чат.');

        await ctx.answerCbQuery(`Генерирую облако слов ${PERIOD_NAMES[period]}...`);

        try {
            const messageText = await generateWordCloudMessage(chatId, period);
            await ctx.editMessageText(messageText, {
                parse_mode: 'HTML',
                reply_markup: wordCloudKeyboard.reply_markup
            });
        } catch (error) {
            console.error(error);
            await ctx.editMessageText('❌ Ошибка при генерации облака слов.');
        }
    });
    // #endregion
}

// #region Helper Functions
async function generateChatStatsMessage(chatId: number, period: Period): Promise<string> {
    const cacheKey = `stats:${chatId}:${period}`;
    const cached = await cacheService.get<{ topUsers: TopUserStats[], chatStats: ChatStats }>(cacheKey);

    if (cached) return formatChatStats(cached.topUsers, cached.chatStats, period);

    const [topUsers, chatStats] = await Promise.all([
        StatsService.getTopUsers(chatId, period),
        StatsService.getChatStats(chatId, period)
    ]);
    await cacheService.set(cacheKey, { topUsers, chatStats });

    return formatChatStats(topUsers, chatStats, period);
}

async function generateUserStatsMessage(userId: number, chatId: number, userName: string): Promise<string> {
    const userStats = await StatsService.getUserStats(userId, chatId, 'all');
    if (!userStats || userStats.messageCount === 0) {
        return `📊 <b>Статистика для ${userName}</b>\n\nВы еще не писали сообщения в этом чате.`;
    }
    return `📊 <b>Статистика для ${userName}</b> (за всё время)\n\n- 📝 Всего сообщений: <b>${userStats.messageCount}</b>\n- 📏 Средняя длина: <b>${userStats.avgMessageLength.toFixed(1)}</b> симв.\n- 📅 Первое сообщение: <b>${userStats.firstMessage.toLocaleDateString('ru-RU')}</b>\n- 📅 Последнее: <b>${userStats.lastMessage.toLocaleDateString('ru-RU')}</b>`;
}

async function generateWordCloudMessage(chatId: number, period: Period): Promise<string> {
    const cacheKey = `wordcloud:${chatId}:${period}`;
    const cached = await cacheService.get<{ words: WordCount[], totalMessages: number }>(cacheKey);

    if (cached) return formatWordCloud(cached.words, cached.totalMessages, period);

    const { words, totalMessages } = await WordCloudService.getTopWords(chatId, period);
    if (words.length > 0) {
        await cacheService.set(cacheKey, { words, totalMessages });
    }

    return formatWordCloud(words, totalMessages, period);
}

function formatChatStats(topUsers: TopUserStats[], chatStats: ChatStats, period: Period): string {
    let msg = `📊 <b>Статистика чата ${PERIOD_NAMES[period]}</b>\n\n`;
    if (topUsers.length === 0) return msg + 'Нет данных для отображения.';

    msg += '🏆 <b>Топ-10 активных:</b>\n';
    const medals = ['🥇', '🥈', '🥉'];
    topUsers.forEach((user, i) => {
        const name = user.username ? `@${user.username}` : (user.firstName || 'Unknown');
        const icon = i < 3 ? medals[i] : `${i + 1}️⃣`;
        msg += `${icon} ${name} - <b>${user.messageCount}</b> ${getMessagesNoun(user.messageCount)}\n`;
    });

    msg += `\n📈 <b>Общее:</b>\n• Всего сообщений: <b>${chatStats.totalMessages}</b>\n• Участников: <b>${chatStats.uniqueUsers}</b>`;
    return msg;
}

function formatWordCloud(words: WordCount[], totalMessages: number, period: Period): string {
    let msg = `☁️ <b>Облако слов ${PERIOD_NAMES[period]}</b>\n\n`;
    if (words.length === 0) return msg + 'Недостаточно слов для анализа.';

    const medals = ['🥇', '🥈', '🥉'];
    words.forEach((word, i) => {
        const icon = i < 3 ? medals[i] : `${i + 1}️⃣`;
        msg += `${icon} ${word.word} — <b>${word.count}</b> раз\n`;
    });

    msg += `\n📊 <i>Проанализировано ${totalMessages} сообщений</i>`;
    return msg;
}

function getMessagesNoun(count: number): string {
    const cases = [2, 0, 1, 1, 1, 2];
    const titles = ['сообщение', 'сообщения', 'сообщений'];
    return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[(count % 10 < 5) ? count % 10 : 5]];
}