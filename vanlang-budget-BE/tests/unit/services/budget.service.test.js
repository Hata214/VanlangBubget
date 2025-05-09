/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';

// Tạo mock functions trước
const mockSort = jest.fn();
const mockFind = jest.fn(() => ({ sort: mockSort }));
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOneAndDelete = jest.fn();

// Đặt thiết lập jest.mock trước khi import bất kỳ module nào
jest.mock('../../../src/models/budgetModel.js', () => ({
    default: {
        find: mockFind,
        findOne: mockFindOne,
        create: mockCreate,
        findOneAndUpdate: mockFindOneAndUpdate,
        findOneAndDelete: mockFindOneAndDelete
    }
}));

import mongoose from 'mongoose';
import budgetModel from '../../../src/models/budgetModel.js';
import * as budgetService from '../../../src/services/budgetService.js';

describe('Budget Service Tests', () => {
    // Reset mocks sau mỗi test
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getBudgets', () => {
        test('Lấy tất cả ngân sách của người dùng', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const mockBudgets = [
                { _id: '1', category: 'Thực phẩm', amount: 5000000, userId, month: 5, year: 2023 },
                { _id: '2', category: 'Giải trí', amount: 7000000, userId, month: 5, year: 2023 }
            ];

            mockSort.mockResolvedValue(mockBudgets);

            const result = await budgetService.getBudgets(userId);

            expect(mockFind).toHaveBeenCalledWith({ userId });
            expect(mockSort).toHaveBeenCalledWith({ year: -1, month: -1 });
            expect(result).toEqual(mockBudgets);
        });
    });

    describe('getBudgetById', () => {
        test('Lấy ngân sách theo ID thành công', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const budgetId = new mongoose.Types.ObjectId().toString();
            const mockBudget = {
                _id: budgetId,
                category: 'Thực phẩm',
                amount: 5000000,
                userId,
                month: 5,
                year: 2023
            };

            mockFindOne.mockResolvedValue(mockBudget);

            const result = await budgetService.getBudgetById(budgetId, userId);

            expect(mockFindOne).toHaveBeenCalledWith({ _id: budgetId, userId });
            expect(result).toEqual(mockBudget);
        });

        test('Ném lỗi khi không tìm thấy ngân sách', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const budgetId = new mongoose.Types.ObjectId().toString();

            mockFindOne.mockResolvedValue(null);

            await expect(budgetService.getBudgetById(budgetId, userId))
                .rejects
                .toThrow('Không tìm thấy ngân sách');
        });
    });

    describe('createBudget', () => {
        test('Tạo ngân sách mới thành công', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const budgetData = {
                category: 'Thực phẩm',
                amount: 5000000,
                month: 5,
                year: 2023
            };

            const mockBudget = {
                _id: new mongoose.Types.ObjectId().toString(),
                ...budgetData,
                userId
            };

            mockCreate.mockResolvedValue(mockBudget);

            const result = await budgetService.createBudget(budgetData, userId);

            expect(mockCreate).toHaveBeenCalledWith({
                ...budgetData,
                userId
            });
            expect(result).toEqual(mockBudget);
        });
    });

    describe('updateBudget', () => {
        test('Cập nhật ngân sách thành công', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const budgetId = new mongoose.Types.ObjectId().toString();
            const updateData = {
                category: 'Thực phẩm - Cập nhật',
                amount: 6000000
            };

            const mockUpdatedBudget = {
                _id: budgetId,
                category: 'Thực phẩm - Cập nhật',
                amount: 6000000,
                userId,
                month: 5,
                year: 2023
            };

            mockFindOneAndUpdate.mockResolvedValue(mockUpdatedBudget);

            const result = await budgetService.updateBudget(budgetId, updateData, userId);

            expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
                { _id: budgetId, userId },
                updateData,
                { new: true, runValidators: true }
            );
            expect(result).toEqual(mockUpdatedBudget);
        });

        test('Ném lỗi khi không tìm thấy ngân sách để cập nhật', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const budgetId = new mongoose.Types.ObjectId().toString();
            const updateData = { category: 'Thực phẩm - Cập nhật' };

            mockFindOneAndUpdate.mockResolvedValue(null);

            await expect(budgetService.updateBudget(budgetId, updateData, userId))
                .rejects
                .toThrow('Không tìm thấy ngân sách');
        });
    });

    describe('deleteBudget', () => {
        test('Xóa ngân sách thành công', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const budgetId = new mongoose.Types.ObjectId().toString();
            const mockBudget = {
                _id: budgetId,
                category: 'Thực phẩm',
                userId,
                month: 5,
                year: 2023
            };

            mockFindOneAndDelete.mockResolvedValue(mockBudget);

            const result = await budgetService.deleteBudget(budgetId, userId);

            expect(mockFindOneAndDelete).toHaveBeenCalledWith({ _id: budgetId, userId });
            expect(result).toEqual({ success: true });
        });

        test('Ném lỗi khi không tìm thấy ngân sách để xóa', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const budgetId = new mongoose.Types.ObjectId().toString();

            mockFindOneAndDelete.mockResolvedValue(null);

            await expect(budgetService.deleteBudget(budgetId, userId))
                .rejects
                .toThrow('Không tìm thấy ngân sách');
        });
    });
}); 