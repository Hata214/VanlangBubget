import Investment from '../models/investmentModel.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import mongoose from 'mongoose';

/**
 * @desc    Phân tích phân bổ tài sản theo loại đầu tư
 * @route   GET /api/investments/analytics/allocation
 * @access  Private
 */
export const getAssetAllocation = async (req, res) => {
    try {
        const userId = req.user.id;

        // Tìm tất cả khoản đầu tư của người dùng
        const investments = await Investment.find({ userId });

        if (!investments || investments.length === 0) {
            return successResponse(res, 'Không có dữ liệu đầu tư', {
                totalValue: 0,
                allocation: []
            });
        }

        // Tính tổng giá trị đầu tư
        const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

        // Nhóm theo loại đầu tư
        const typeGroups = {};
        investments.forEach(inv => {
            if (!typeGroups[inv.type]) {
                typeGroups[inv.type] = {
                    type: inv.type,
                    value: 0,
                    count: 0,
                    percentage: 0
                };
            }
            typeGroups[inv.type].value += inv.currentValue;
            typeGroups[inv.type].count += 1;
        });

        // Tính phần trăm
        Object.keys(typeGroups).forEach(type => {
            typeGroups[type].percentage = totalValue > 0
                ? (typeGroups[type].value / totalValue) * 100
                : 0;
        });

        // Chuyển object thành array
        const allocation = Object.values(typeGroups);

        return successResponse(res, 'Lấy phân bổ tài sản thành công', {
            totalValue,
            allocation
        });
    } catch (error) {
        console.error('Error getting asset allocation:', error);
        return errorResponse(res, 'Lỗi khi lấy phân bổ tài sản', 500);
    }
};

/**
 * @desc    Thống kê hiệu suất đầu tư theo thời gian
 * @route   GET /api/investments/analytics/performance
 * @access  Private
 */
export const getPerformanceOverTime = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = 'month', count = 12 } = req.query;

        // Tìm tất cả khoản đầu tư của người dùng
        const investments = await Investment.find({ userId });

        if (!investments || investments.length === 0) {
            return successResponse(res, 'Không có dữ liệu đầu tư', []);
        }

        // Tạo mảng thời gian để thống kê
        const timeFrames = generateTimeFrames(period, count);

        // Phân tích hiệu suất cho từng khoảng thời gian
        const performance = [];

        for (let i = 0; i < timeFrames.length; i++) {
            const frame = timeFrames[i];
            const investmentsInFrame = investments.filter(inv =>
                new Date(inv.createdAt) <= frame.endDate
            );

            // Tính tổng giá trị và lợi nhuận
            let totalValue = 0;
            let totalInvestment = 0;
            let totalProfitLoss = 0;

            investmentsInFrame.forEach(inv => {
                totalValue += inv.currentValue;
                totalInvestment += inv.initialInvestment;
                totalProfitLoss += inv.profitLoss;
            });

            performance.push({
                period: frame.label,
                startDate: frame.startDate,
                endDate: frame.endDate,
                totalValue,
                totalInvestment,
                profitLoss: totalProfitLoss,
                roi: totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0
            });
        }

        return successResponse(res, 'Lấy hiệu suất theo thời gian thành công', performance);
    } catch (error) {
        console.error('Error getting performance over time:', error);
        return errorResponse(res, 'Lỗi khi lấy hiệu suất theo thời gian', 500);
    }
};

/**
 * @desc    So sánh hiệu suất các loại đầu tư
 * @route   GET /api/investments/analytics/comparison
 * @access  Private
 */
export const getInvestmentComparison = async (req, res) => {
    try {
        const userId = req.user.id;

        // Tìm tất cả khoản đầu tư của người dùng
        const investments = await Investment.find({ userId });

        if (!investments || investments.length === 0) {
            return successResponse(res, 'Không có dữ liệu đầu tư', []);
        }

        // Nhóm theo loại đầu tư
        const typeGroups = {};
        investments.forEach(inv => {
            if (!typeGroups[inv.type]) {
                typeGroups[inv.type] = {
                    type: inv.type,
                    count: 0,
                    totalInvestment: 0,
                    totalValue: 0,
                    profitLoss: 0,
                    roi: 0,
                    bestPerformer: null,
                    worstPerformer: null
                };
            }

            typeGroups[inv.type].count += 1;
            typeGroups[inv.type].totalInvestment += inv.initialInvestment;
            typeGroups[inv.type].totalValue += inv.currentValue;
            typeGroups[inv.type].profitLoss += inv.profitLoss;

            // Kiểm tra nếu là performer tốt nhất/tệ nhất
            if (!typeGroups[inv.type].bestPerformer || inv.roi > typeGroups[inv.type].bestPerformer.roi) {
                typeGroups[inv.type].bestPerformer = {
                    id: inv._id,
                    name: inv.assetName,
                    roi: inv.roi,
                    profitLoss: inv.profitLoss
                };
            }

            if (!typeGroups[inv.type].worstPerformer || inv.roi < typeGroups[inv.type].worstPerformer.roi) {
                typeGroups[inv.type].worstPerformer = {
                    id: inv._id,
                    name: inv.assetName,
                    roi: inv.roi,
                    profitLoss: inv.profitLoss
                };
            }
        });

        // Tính ROI cho từng nhóm
        Object.keys(typeGroups).forEach(type => {
            typeGroups[type].roi = typeGroups[type].totalInvestment > 0
                ? (typeGroups[type].profitLoss / typeGroups[type].totalInvestment) * 100
                : 0;
        });

        // Chuyển object thành array và sắp xếp theo ROI giảm dần
        const comparison = Object.values(typeGroups).sort((a, b) => b.roi - a.roi);

        return successResponse(res, 'Lấy so sánh đầu tư thành công', comparison);
    } catch (error) {
        console.error('Error getting investment comparison:', error);
        return errorResponse(res, 'Lỗi khi lấy so sánh đầu tư', 500);
    }
};

/**
 * Hàm phụ trợ để tạo các khoảng thời gian
 * @param {string} period - Đơn vị thời gian (day, week, month, year)
 * @param {number} count - Số lượng khoảng thời gian
 * @returns {Array} Mảng các khoảng thời gian
 */
const generateTimeFrames = (period, count) => {
    const now = new Date();
    const frames = [];

    for (let i = 0; i < count; i++) {
        const endDate = new Date(now);
        let startDate = new Date(now);
        let label = '';

        switch (period) {
            case 'day':
                endDate.setDate(now.getDate() - i);
                startDate.setDate(now.getDate() - i - 1);
                label = endDate.toLocaleDateString('vi-VN');
                break;
            case 'week':
                endDate.setDate(now.getDate() - (i * 7));
                startDate.setDate(now.getDate() - (i * 7) - 7);
                label = `Tuần ${count - i}`;
                break;
            case 'month':
                endDate.setMonth(now.getMonth() - i);
                endDate.setDate(1);
                endDate.setMonth(endDate.getMonth() + 1);
                endDate.setDate(0); // Ngày cuối tháng

                startDate.setMonth(now.getMonth() - i);
                startDate.setDate(1);

                label = `${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
                break;
            case 'year':
                endDate.setFullYear(now.getFullYear() - i);
                endDate.setMonth(11);
                endDate.setDate(31);

                startDate.setFullYear(now.getFullYear() - i);
                startDate.setMonth(0);
                startDate.setDate(1);

                label = startDate.getFullYear().toString();
                break;
            default:
                endDate.setMonth(now.getMonth() - i);
                startDate.setMonth(now.getMonth() - i - 1);
                label = `${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
        }

        frames.push({ startDate, endDate, label });
    }

    return frames.reverse(); // Đảm bảo thứ tự thời gian tăng dần
};

/**
 * @desc    Lấy đầu tư có hiệu suất tốt nhất/tệ nhất
 * @route   GET /api/investments/analytics/top-performers
 * @access  Private
 */
export const getTopPerformers = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 5, sortBy = 'roi' } = req.query;

        // Lấy danh sách các đầu tư có status = active
        const investments = await Investment.find({
            userId,
            status: 'active',
            initialInvestment: { $gt: 0 } // Chỉ xét các khoản thực sự có đầu tư
        });

        if (!investments || investments.length === 0) {
            return successResponse(res, 'Không có dữ liệu đầu tư', {
                best: [],
                worst: []
            });
        }

        // Sắp xếp theo hiệu suất
        const sortedInvestments = [...investments].sort((a, b) => {
            if (sortBy === 'roi') {
                return b.roi - a.roi;
            }
            return b.profitLoss - a.profitLoss;
        });

        // Lấy top và bottom performers
        const limitNum = Math.min(parseInt(limit), investments.length);
        const bestPerformers = sortedInvestments.slice(0, limitNum).map(inv => ({
            id: inv._id,
            name: inv.assetName,
            type: inv.type,
            symbol: inv.symbol,
            investment: inv.initialInvestment,
            currentValue: inv.currentValue,
            profitLoss: inv.profitLoss,
            roi: inv.roi
        }));

        const worstPerformers = sortedInvestments.slice(-limitNum).reverse().map(inv => ({
            id: inv._id,
            name: inv.assetName,
            type: inv.type,
            symbol: inv.symbol,
            investment: inv.initialInvestment,
            currentValue: inv.currentValue,
            profitLoss: inv.profitLoss,
            roi: inv.roi
        }));

        return successResponse(res, 'Lấy danh sách đầu tư hiệu suất cao/thấp thành công', {
            best: bestPerformers,
            worst: worstPerformers
        });
    } catch (error) {
        console.error('Error getting top performers:', error);
        return errorResponse(res, 'Lỗi khi lấy danh sách đầu tư hiệu suất cao/thấp', 500);
    }
}; 