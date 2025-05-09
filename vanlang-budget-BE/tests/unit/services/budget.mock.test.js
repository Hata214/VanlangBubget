/**
 * @jest-environment node
 */

// Tạo mocks trước khi import
const mockFind = { sort: jest.fn() };
const mockBudgetModel = {
    __esModule: true,
    default: {
        find: jest.fn(() => mockFind),
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn()
    }
};

// Thiết lập mock
jest.mock('../../../src/models/budgetModel.js', () => mockBudgetModel);

// Import các module cần test
import mongoose from 'mongoose';
import * as budgetService from '../../../src/services/budgetService.js';

describe('Budget Service Tests', () => {
    beforeEach(() => {
        // Reset mock trước mỗi test
        jest.clearAllMocks();
    });

    describe('getBudgetById', () => {
        test('Lấy thông tin budget thành công', async () => {
            const userId = '123456789012';
            const budgetId = '123456789012';
            const mockBudget = {
                _id: budgetId,
                category: 'Food',
                amount: 100000
            };

            // Thiết lập giá trị trả về cho mock
            mockBudgetModel.default.findOne.mockResolvedValueOnce(mockBudget);

            // Gọi hàm cần test
            const result = await budgetService.getBudgetById(budgetId, userId);

            // Kiểm tra kết quả
            expect(mockBudgetModel.default.findOne).toHaveBeenCalledWith({ _id: budgetId, userId });
            expect(result).toEqual(mockBudget);
        });
    });
}); 