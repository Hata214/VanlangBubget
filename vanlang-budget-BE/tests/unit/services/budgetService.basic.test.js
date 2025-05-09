/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Budget from '../../../src/models/budgetModel.js';
import * as budgetService from '../../../src/services/budgetService.js';

describe('Budget Service - Kiểm tra cơ bản', () => {
    test('Môi trường test hoạt động', () => {
        expect(true).toBe(true);
    });

    test('Có thể import mongoose', () => {
        expect(mongoose).toBeDefined();
        expect(typeof mongoose).toBe('object');
    });

    test('Phương thức getBudgets có tồn tại', () => {
        expect(budgetService.getBudgets).toBeDefined();
        expect(typeof budgetService.getBudgets).toBe('function');
    });

    test('Phương thức getBudgetById có tồn tại', () => {
        expect(budgetService.getBudgetById).toBeDefined();
        expect(typeof budgetService.getBudgetById).toBe('function');
    });

    test('Phương thức createBudget có tồn tại', () => {
        expect(budgetService.createBudget).toBeDefined();
        expect(typeof budgetService.createBudget).toBe('function');
    });

    test('Phương thức updateBudget có tồn tại', () => {
        expect(budgetService.updateBudget).toBeDefined();
        expect(typeof budgetService.updateBudget).toBe('function');
    });

    test('Phương thức deleteBudget có tồn tại', () => {
        expect(budgetService.deleteBudget).toBeDefined();
        expect(typeof budgetService.deleteBudget).toBe('function');
    });

    test('Budget Schema có cấu trúc đúng', () => {
        expect(Budget).toBeDefined();
        expect(Budget.schema).toBeDefined();

        // Kiểm tra các trường cơ bản trong schema
        const paths = Budget.schema.paths;
        expect(paths).toBeDefined();

        // Kiểm tra xem có các trường quan trọng không
        const expectedFields = ['userId', 'category', 'amount', 'month', 'year'];
        expectedFields.forEach(field => {
            expect(paths[field]).toBeDefined();
        });
    });
});

// Kết luận kiểm tra
describe('Kết luận', () => {
    test('Budget Service có cấu trúc và API đúng', () => {
        // Kiểm tra tất cả các phương thức cần thiết tồn tại
        const methods = [
            'getBudgets',
            'getBudgetById',
            'createBudget',
            'updateBudget',
            'deleteBudget'
        ];

        methods.forEach(method => {
            expect(typeof budgetService[method]).toBe('function');
        });

        // Kết luận
        expect(true).toBe(true);
    });
}); 