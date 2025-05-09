/**
 * @jest-environment node
 */

import request from 'supertest';
import { startServer, stopServer, clearDatabase } from '../../setup.js';
import User from '../../../src/models/userModel.js';
import ExpenseCategory from '../../../src/models/expenseCategoryModel.js';
import { createTokenPair } from '../../../src/utils/jwtUtils.js';

let app;
let token;
let userId;
let categoryId;

// Setup trước khi test
beforeAll(async () => {
    app = await startServer();

    // Tạo một người dùng test
    const user = await User.create({
        email: 'expense-test@example.com',
        password: 'Password123!',
        firstName: 'Expense',
        lastName: 'Test',
        isEmailVerified: true
    });

    userId = user._id;
    const { accessToken } = createTokenPair(userId);
    token = accessToken;

    // Tạo một danh mục chi tiêu
    const category = await ExpenseCategory.create({
        name: 'Thức ăn',
        icon: 'food',
        color: '#FF5733',
        description: 'Chi tiêu cho thức ăn',
        userId: userId
    });

    categoryId = category._id;
});

// Cleanup sau khi test
afterAll(async () => {
    await stopServer();
});

// Xóa collections sau mỗi test
afterEach(async () => {
    await clearDatabase();

    // Tạo lại user sau mỗi test
    const user = await User.create({
        email: 'expense-test@example.com',
        password: 'Password123!',
        firstName: 'Expense',
        lastName: 'Test',
        isEmailVerified: true
    });

    userId = user._id;
    const { accessToken } = createTokenPair(userId);
    token = accessToken;

    // Tạo lại danh mục chi tiêu
    const category = await ExpenseCategory.create({
        name: 'Thức ăn',
        icon: 'food',
        color: '#FF5733',
        description: 'Chi tiêu cho thức ăn',
        userId: userId
    });

    categoryId = category._id;
});

describe('Expense API Integration Tests', () => {
    // Test tạo khoản chi tiêu mới
    test('Tạo khoản chi tiêu mới', async () => {
        const expenseData = {
            amount: 150000,
            description: 'Ăn trưa',
            date: new Date().toISOString(),
            categoryId: categoryId.toString(),
            paymentMethod: 'cash',
            location: 'Nhà hàng ABC'
        };

        const response = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data.amount).toBe(expenseData.amount);
        expect(response.body.data.description).toBe(expenseData.description);
    });

    // Test lấy tất cả khoản chi tiêu
    test('Lấy tất cả khoản chi tiêu của người dùng', async () => {
        // Tạo một vài khoản chi tiêu trước
        const expenseData1 = {
            amount: 150000,
            description: 'Ăn trưa',
            date: new Date().toISOString(),
            categoryId: categoryId.toString(),
            paymentMethod: 'cash',
            location: 'Nhà hàng ABC'
        };

        const expenseData2 = {
            amount: 200000,
            description: 'Ăn tối',
            date: new Date().toISOString(),
            categoryId: categoryId.toString(),
            paymentMethod: 'card',
            location: 'Nhà hàng XYZ'
        };

        await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseData1);

        await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseData2);

        // Lấy tất cả khoản chi tiêu
        const response = await request(app)
            .get('/api/expenses')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    // Test lấy khoản chi tiêu theo ID
    test('Lấy khoản chi tiêu theo ID', async () => {
        // Tạo khoản chi tiêu trước
        const expenseData = {
            amount: 150000,
            description: 'Ăn trưa',
            date: new Date().toISOString(),
            categoryId: categoryId.toString(),
            paymentMethod: 'cash',
            location: 'Nhà hàng ABC'
        };

        const createResponse = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseData);

        const expenseId = createResponse.body.data._id;

        // Lấy khoản chi tiêu theo ID
        const response = await request(app)
            .get(`/api/expenses/${expenseId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data._id).toBe(expenseId);
        expect(response.body.data.amount).toBe(expenseData.amount);
    });

    // Test cập nhật khoản chi tiêu
    test('Cập nhật khoản chi tiêu', async () => {
        // Tạo khoản chi tiêu trước
        const expenseData = {
            amount: 150000,
            description: 'Ăn trưa',
            date: new Date().toISOString(),
            categoryId: categoryId.toString(),
            paymentMethod: 'cash',
            location: 'Nhà hàng ABC'
        };

        const createResponse = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseData);

        const expenseId = createResponse.body.data._id;

        // Cập nhật khoản chi tiêu
        const updateData = {
            amount: 180000,
            description: 'Ăn trưa (đã cập nhật)',
            paymentMethod: 'momo'
        };

        const response = await request(app)
            .put(`/api/expenses/${expenseId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data._id).toBe(expenseId);
        expect(response.body.data.amount).toBe(updateData.amount);
        expect(response.body.data.description).toBe(updateData.description);
        expect(response.body.data.paymentMethod).toBe(updateData.paymentMethod);
    });

    // Test xóa khoản chi tiêu
    test('Xóa khoản chi tiêu', async () => {
        // Tạo khoản chi tiêu trước
        const expenseData = {
            amount: 150000,
            description: 'Ăn trưa',
            date: new Date().toISOString(),
            categoryId: categoryId.toString(),
            paymentMethod: 'cash',
            location: 'Nhà hàng ABC'
        };

        const createResponse = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseData);

        const expenseId = createResponse.body.data._id;

        // Xóa khoản chi tiêu
        const response = await request(app)
            .delete(`/api/expenses/${expenseId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);

        // Kiểm tra xem khoản chi tiêu đã bị xóa chưa
        const getResponse = await request(app)
            .get(`/api/expenses/${expenseId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(getResponse.status).toBe(404);
    });

    // Test filter khoản chi tiêu theo khoảng thời gian
    test('Lọc khoản chi tiêu theo khoảng thời gian', async () => {
        // Tạo khoản chi tiêu cho tháng trước
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const expenseLastMonth = {
            amount: 150000,
            description: 'Ăn trưa tháng trước',
            date: lastMonth.toISOString(),
            categoryId: categoryId.toString(),
            paymentMethod: 'cash'
        };

        // Tạo khoản chi tiêu cho tháng hiện tại
        const currentMonth = new Date();

        const expenseCurrentMonth = {
            amount: 200000,
            description: 'Ăn trưa tháng này',
            date: currentMonth.toISOString(),
            categoryId: categoryId.toString(),
            paymentMethod: 'cash'
        };

        // Thêm cả hai khoản chi tiêu
        await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseLastMonth);

        await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send(expenseCurrentMonth);

        // Lấy khoản chi tiêu của tháng hiện tại
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();

        const response = await request(app)
            .get(`/api/expenses?startDate=${startOfMonth}&endDate=${endOfMonth}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);

        // Kiểm tra xem kết quả chỉ chứa khoản chi tiêu của tháng hiện tại
        const allCurrentMonth = response.body.data.every(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth.getMonth() &&
                expenseDate.getFullYear() === currentMonth.getFullYear();
        });

        expect(allCurrentMonth).toBeTruthy();
    });
}); 