import { Context } from 'telegraf';
import { MessageModel } from '../models/Message';
import { UserModel } from '../models/User';

export async function messageHandler(ctx: Context) {
  try {
    // Check if it's a text message in a group/supergroup
    if (!ctx.message || !('text' in ctx.message) || !ctx.chat || !(['group', 'supergroup'].includes(ctx.chat.type))) {
      return;
    }

    const message = ctx.message;
    const chatId = ctx.chat.id;

    // Save user to database
    const user = await UserModel.findOrCreate({
      telegramId: message.from!.id,
      username: message.from?.username,
      firstName: message.from?.first_name,
      lastName: message.from?.last_name,
    });

    // Save message to database
    await MessageModel.create({
      userId: user.telegramId,
      chatId: chatId,
      messageText: message.text,
      messageDate: new Date(message.date * 1000), 
    });
  } catch (error) {
    console.error('Error in messageHandler:', error);
  }
}