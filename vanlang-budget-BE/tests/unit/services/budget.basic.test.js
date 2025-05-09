/**
 * @jest-environment node
 */

// Import service để test trực tiếp
import mongoose from 'mongoose';
import * as budgetService from '../../../src/services/budgetService.js';

// Test trực tiếp không cần mock
describe('Budget Service - Basic Structure Test', () => {
    test('budgetService should have required methods', () => {
        expect(typeof budgetService.getBudgets).toBe('function');
        expect(typeof budgetService.getBudgetById).toBe('function');
        expect(typeof budgetService.createBudget).toBe('function');
        expect(typeof budgetService.updateBudget).toBe('function');
        expect(typeof budgetService.deleteBudget).toBe('function');
    });
}); 