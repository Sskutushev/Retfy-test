import { vi } from 'vitest';

// Mock the entire 'pg' library
vi.mock('pg', () => {
    const mockPool = {
        connect: vi.fn(),
        query: vi.fn(),
        end: vi.fn(),
        on: vi.fn(), // Add the 'on' method to prevent TypeError
    };
    return {
        Pool: vi.fn(() => mockPool),
    };
});

// Mock the entire 'redis' library
vi.mock('redis', () => {
    const mockRedisClient = {
        on: vi.fn(),
        connect: vi.fn().mockResolvedValue(true),
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        keys: vi.fn(),
    };
    return {
        createClient: vi.fn(() => mockRedisClient),
    };
});
