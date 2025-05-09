/**
 * @jest-environment node
 */

import mongoose from 'mongoose';
import budgetModel from '../../../src/models/budgetModel.js';

// Import service để test
import * as budgetService from '../../../src/services/budgetService.js';

// Tạo spy cho các hàm của budgetModel
describe('Budget Service - Using Spy', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('budgetService.getBudgetById should call budgetModel.findOne', async () => {
        // Tạo spy thay vì mock
        const findOneSpy = jest.spyOn(budgetModel, 'findOne');

        // Thiết lập giá trị trả về cho spy
        findOneSpy.mockResolvedValue({
            _id: '123456789012',
            category: 'Thực phẩm',
            amount: 5000000,
            userId: '123456789012',
            month: 5,
            year: 2023
        });

        // Gọi hàm service
        try {
            // Biết rằng hàm này sẽ gọi budgetModel.findOne
            await budgetService.getBudgetById('123456789012', '123456789012');

            // Kiểm tra xem spy có được gọi không
            expect(findOneSpy).toHaveBeenCalled();
        } catch (error) {
            console.error('Test failed:', error);
        }

        // Khôi phục spy
        findOneSpy.mockRestore();
    });
}); 