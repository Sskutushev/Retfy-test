import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { StatsService } from '../../services/stats.service';

const mockPool = new Pool();

describe('StatsService', () => {
    beforeEach(() => {
        vi.mocked(mockPool.query).mockClear();
    });

    it('should get top users', async () => {
        const mockUsers = [
            { telegram_id: 1, username: 'user1', first_name: 'A', last_name: 'B', message_count: 100 },
            { telegram_id: 2, username: 'user2', first_name: 'C', last_name: 'D', message_count: 90 },
        ];
        vi.mocked(mockPool.query).mockResolvedValueOnce({ rows: mockUsers } as any);

        const result = await StatsService.getTopUsers(123, 'week');
        
        expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), [123, expect.any(Date)]);
        expect(result).toHaveLength(2);
        expect(result[0].messageCount).toBe(100);
    });

    it('should get user stats', async () => {
        const mockStats = {
            message_count: '55',
            avg_message_length: '42.5',
            first_message: new Date(),
            last_message: new Date(),
        };
        vi.mocked(mockPool.query).mockResolvedValueOnce({ rows: [mockStats] } as any);

        const result = await StatsService.getUserStats(123, 456, 'month');

        expect(result).not.toBeNull();
        expect(result?.messageCount).toBe(55);
        expect(result?.avgMessageLength).toBe(42.5);
    });

    it('should return null for user with no stats', async () => {
        vi.mocked(mockPool.query).mockResolvedValueOnce({ rows: [{ message_count: '0' }] } as any);

        const result = await StatsService.getUserStats(123, 456, 'month');
        expect(result).toBeNull();
    });

    it('should get chat stats', async () => {
        const mockChatStats = {
            total_messages: '1234',
            unique_users: '56',
        };
        vi.mocked(mockPool.query).mockResolvedValueOnce({ rows: [mockChatStats] } as any);

        const result = await StatsService.getChatStats(789, 'all');

        expect(result.totalMessages).toBe(1234);
        expect(result.uniqueUsers).toBe(56);
    });
});
