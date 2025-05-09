/**
 * @jest-environment node
 */

// Import các module thực
import mongoose from 'mongoose';
import { getBudgetById } from '../../../src/services/budgetService.js';

// Import mock thủ công - Jest sẽ không tự động mock
import budgetModel from '../../mocks/budgetModel.js';

// Test với mock thủ công
describe('Budget Service Tests - Manual Mocking', () => {
    beforeEach(() => {
        // Reset mocks trước mỗi test
        budgetModel.findOne.mockReset();
    });

    test('getBudgetById should return budget when found', async () => {
        // Chuẩn bị
        const userId = '123456789012';
        const budgetId = '123456789012';
        const mockBudget = {
            _id: budgetId,
            category: 'Thực phẩm',
            amount: 5000000
        };

        // Thiết lập mock
        budgetModel.findOne.mockResolvedValue(mockBudget);

        try {
            // Thực hiện
            const result = await getBudgetById(budgetId, userId);

            // Kiểm tra
            expect(budgetModel.findOne).toHaveBeenCalled();
            expect(result).toEqual(mockBudget);
        } catch (error) {
            // Test sẽ fail nếu có lỗi
            console.error('Test failed:', error);
            throw error;
        }
    });
}); 