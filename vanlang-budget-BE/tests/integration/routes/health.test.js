/**
 * @jest-environment node
 */

import request from 'supertest';
import { startServer, stopServer } from '../../setup.js';

let app;

// Setup trước khi test
beforeAll(async () => {
    app = await startServer();
});

// Cleanup sau khi test
afterAll(async () => {
    await stopServer();
});

describe('Health Check API', () => {
    test('Trả về status 200 và message OK khi gọi GET /api/health', async () => {
        // Nếu endpoint này không tồn tại trong app của bạn, hãy tạo route tương tự
        // để kiểm tra hoạt động cơ bản của API
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('ok');
    });
}); 