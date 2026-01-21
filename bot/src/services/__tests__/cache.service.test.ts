import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from 'redis';
import { cacheService } from '../../services/cache.service';
import { config } from '../../config';

// Get the mock client instance
const mockRedisClient = createClient();

describe('CacheService', () => {
    beforeEach(() => {
        vi.mocked(mockRedisClient.get).mockClear();
        vi.mocked(mockRedisClient.set).mockClear();
        vi.mocked(mockRedisClient.del).mockClear();
    });

    it('should get data from cache', async () => {
        const key = 'test-key';
        const value = { data: 'test-data' };
        vi.mocked(mockRedisClient.get).mockResolvedValueOnce(JSON.stringify(value));

        const result = await cacheService.get(key);

        expect(mockRedisClient.get).toHaveBeenCalledWith(key);
        expect(result).toEqual(value);
    });

    it('should return null if data not in cache', async () => {
        const key = 'non-existent-key';
        vi.mocked(mockRedisClient.get).mockResolvedValueOnce(null);

        const result = await cacheService.get(key);

        expect(result).toBeNull();
    });

    it('should set data in cache with default TTL', async () => {
        const key = 'test-key';
        const value = { data: 'test-data' };

        await cacheService.set(key, value);

        expect(mockRedisClient.set).toHaveBeenCalledWith(
            key,
            JSON.stringify(value),
            { EX: config.cache.ttl }
        );
    });

    it('should set data in cache with specified TTL', async () => {
        const key = 'test-key';
        const value = { data: 'test-data' };
        const ttl = 3600;

        await cacheService.set(key, value, ttl);

        expect(mockRedisClient.set).toHaveBeenCalledWith(
            key,
            JSON.stringify(value),
            { EX: ttl }
        );
    });

    it('should delete data from cache', async () => {
        const key = 'test-key';
        await cacheService.delete(key);
        expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
});
