import { createClient, RedisClientType } from 'redis';
import { config } from '../config';

class CacheService {
    private client: RedisClientType;
    private isConnected: boolean = false;

    constructor() {
        this.client = createClient({
            url: `redis://${config.redis.host}:${config.redis.port}`
        });

        this.client.on('error', (err) => console.error('Redis Client Error', err));
        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('Redis connected successfully.');
        });
        this.client.on('end', () => {
            this.isConnected = false;
            console.log('Redis connection closed.');
        });

        this.client.connect();
    }

    private async ensureConnected() {
        if (!this.isConnected) {
            try {
                await this.client.connect();
            } catch (err) {
                console.error('Failed to reconnect to Redis:', err);
            }
        }
    }

    /**
     * Get data from cache.
     * @param key - The cache key.
     * @returns The cached data or null.
     */
    async get<T>(key: string): Promise<T | null> {
        await this.ensureConnected();
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) as T : null;
        } catch (error) {
            console.error(`Error getting cache for key: ${key}`, error);
            return null;
        }
    }

    /**
     * Set data in cache with an optional TTL.
     * @param key 
     * @param value 
     * @param ttl 
     */
    async set(key: string, value: any, ttl: number = config.cache.ttl): Promise<void> {
        await this.ensureConnected();
        try {
            const data = JSON.stringify(value);
            await this.client.set(key, data, { EX: ttl });
        } catch (error) {
            console.error(`Error setting cache for key: ${key}`, error);
        }
    }

    /**
     * Delete a key from the cache.
     * @param key 
     */
    async delete(key: string): Promise<void> {
        await this.ensureConnected();
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`Error deleting cache for key: ${key}`, error);
        }
    }

    /**
     * Deletes all keys matching a pattern.
     * Note: Use with caution in production, as SCAN is better than KEYS.
     * @param pattern 
     */
    async deletePattern(pattern: string): Promise<void> {
        await this.ensureConnected();
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            console.error(`Error deleting cache for pattern: ${pattern}`, error);
        }
    }
}

// Export a singleton instance
export const cacheService = new CacheService();
