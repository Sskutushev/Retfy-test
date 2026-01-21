import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import { MessageModel } from '../Message';

const mockPool = new Pool();

describe('MessageModel', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.mocked(mockPool.query).mockClear();
  });

  it('should create a message', async () => {
    const messageData = {
      userId: 123,
      chatId: 456,
      messageText: 'Hello, world!',
      messageDate: new Date(),
    };
    const expectedMessage = { id: 1, ...messageData, created_at: new Date() };

    vi.mocked(mockPool.query).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          user_id: messageData.userId,
          chat_id: messageData.chatId,
          message_text: messageData.messageText,
          message_date: messageData.messageDate,
          created_at: expectedMessage.created_at,
        },
      ],
      rowCount: 1,
    } as any);

    const result = await MessageModel.create(messageData);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO messages'),
      [messageData.userId, messageData.chatId, messageData.messageText, messageData.messageDate]
    );
    expect(result.id).toBe(1);
    expect(result.userId).toBe(messageData.userId);
  });

  it('should get recent messages by user', async () => {
    const userId = 123;
    const limit = 5;

    vi.mocked(mockPool.query).mockResolvedValueOnce({
      rows: Array(limit).fill({ user_id: userId }),
      rowCount: limit,
    } as any);

    const result = await MessageModel.getRecentByUser(userId, limit);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY message_date DESC'),
      [userId, limit]
    );
    expect(result).toHaveLength(limit);
    expect(result[0].userId).toBe(userId);
  });
  
  it('should get messages by user and period', async () => {
      const userId = 123;
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      vi.mocked(mockPool.query).mockResolvedValueOnce({
          rows: [{ user_id: userId }],
          rowCount: 1
      } as any);

      await MessageModel.getByUserAndPeriod(userId, startDate, endDate);

      expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE user_id = $1'),
          [userId, startDate, endDate]
      );
  });
});
