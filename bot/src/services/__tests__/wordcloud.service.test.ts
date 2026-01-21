import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { WordCloudService } from '../wordcloud.service';

const mockPool = new Pool();

describe('WordCloudService', () => {
    beforeEach(() => {
        vi.mocked(mockPool.query).mockClear();
    });

    it('should return top words and filter stop words', async () => {
        const mockMessages = [
            { message_text: 'hello world this is a test' },
            { message_text: 'hello again world this is fun' },
            { message_text: 'test test test' },
            { message_text: 'and another one' },
            { message_text: 'http://example.com link' },
            { message_text: '@mention someone' },
        ];
        vi.mocked(mockPool.query).mockResolvedValueOnce({ rows: mockMessages } as any);

        const { words, totalMessages } = await WordCloudService.getTopWords(123, 'all', 5);

        expect(totalMessages).toBe(mockMessages.length);
        expect(words).toHaveLength(5);
        
        // 'test' should be first
        expect(words[0]).toEqual({ word: 'test', count: 4 });
        
        // 'hello' and 'world' should be next
        expect(words).toContainEqual({ word: 'hello', count: 2 });
        expect(words).toContainEqual({ word: 'world', count: 2 });
        
        // 'this' and 'is' are stop words and should be filtered
        expect(words.find(w => w.word === 'this')).toBeUndefined();
        expect(words.find(w => w.word === 'is')).toBeUndefined();
        
        // links and mentions should be filtered
        expect(words.find(w => w.word.startsWith('http'))).toBeUndefined();
        expect(words.find(w => w.word.startsWith('@'))).toBeUndefined();
    });

    it('should handle no messages found', async () => {
        vi.mocked(mockPool.query).mockResolvedValueOnce({ rows: [] } as any);
        const { words, totalMessages } = await WordCloudService.getTopWords(123, 'today');
        expect(words).toHaveLength(0);
        expect(totalMessages).toBe(0);
    });
});
