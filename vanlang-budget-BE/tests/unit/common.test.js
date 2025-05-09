/**
 * @jest-environment node
 */

// Test cơ bản nhất để đảm bảo Jest đang hoạt động
describe('Common Test Environment', () => {
    test('Jest is working correctly', () => {
        expect(1 + 1).toBe(2);
    });

    test('Async test is working', async () => {
        const value = await Promise.resolve(42);
        expect(value).toBe(42);
    });

    test('Environment variables are loaded', () => {
        // NODE_ENV luôn luôn được định nghĩa
        expect(process.env.NODE_ENV).toBeDefined();
    });
}); 