import Loan from '../models/loanModel.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Tính toán và cập nhật trạng thái cho các khoản vay
 * @returns {Promise<Object>} Kết quả với số lượng khoản vay đã được cập nhật
 */
export const computeLoanStatuses = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = {
            total: 0,
            paid: 0,
            overdue: 0,
            active: 0,
            updated: 0
        };

        // Lấy tất cả các khoản vay đang hoạt động
        const loans = await Loan.find({
            status: { $ne: 'paid' }
        });

        result.total = loans.length;

        for (const loan of loans) {
            let statusChanged = false;

            // Kiểm tra nếu khoản vay đã trả hết
            if (loan.remainingAmount <= 0) {
                loan.status = 'paid';
                loan.completedDate = today;
                statusChanged = true;
                result.paid++;
            }
            // Kiểm tra nếu khoản vay quá hạn
            else if (loan.dueDate < today && loan.status !== 'overdue') {
                loan.status = 'overdue';
                statusChanged = true;
                result.overdue++;
            }
            // Khoản vay đang hoạt động bình thường
            else if (loan.status === 'active') {
                result.active++;
            }

            // Lưu lại nếu có sự thay đổi về trạng thái
            if (statusChanged) {
                await loan.save();
                result.updated++;

                // Tạo thông báo nếu khoản vay được đánh dấu là đã thanh toán
                if (loan.status === 'paid') {
                    await Notification.create({
                        user: loan.user || null,
                        userId: loan.userId || null,
                        title: 'Khoản vay đã hoàn tất',
                        message: `Khoản vay "${loan.name}" đã được thanh toán đầy đủ.`,
                        type: 'loan',
                        relatedId: loan._id,
                        read: false
                    });
                }
            }
        }

        logger.info(`Loan status computation completed: ${result.updated} loans updated`);
        return result;
    } catch (error) {
        logger.error('Error in computeLoanStatuses:', error);
        throw error;
    }
};

/**
 * Lấy tất cả các khoản vay sắp đến hạn trong thời gian tới
 * @param {Number} days - Số ngày sắp tới để kiểm tra
 * @returns {Promise<Array>} Danh sách các khoản vay sắp đến hạn
 */
export const getUpcomingLoans = async (days = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    try {
        const upcomingLoans = await Loan.find({
            status: 'active',
            dueDate: { $gte: today, $lte: futureDate }
        }).sort({ dueDate: 1 });

        return upcomingLoans;
    } catch (error) {
        logger.error('Error in getUpcomingLoans:', error);
        throw error;
    }
};

/**
 * Tính toán các thống kê về khoản vay của người dùng
 * @param {String} userId - ID của người dùng
 * @returns {Promise<Object>} Thống kê về khoản vay
 */
export const getLoanStatistics = async (userId) => {
    try {
        // Tạo pipeline tổng hợp
        const pipeline = [
            {
                $match: {
                    $or: [
                        { userId: mongoose.Types.ObjectId(userId) },
                        { user: mongoose.Types.ObjectId(userId) }
                    ],
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                    remainingAmount: { $sum: "$remainingAmount" }
                }
            }
        ];

        const statistics = await Loan.aggregate(pipeline);

        // Chuyển đổi kết quả thành đối tượng dễ sử dụng
        const result = {
            active: { count: 0, totalAmount: 0, remainingAmount: 0 },
            overdue: { count: 0, totalAmount: 0, remainingAmount: 0 },
            paid: { count: 0, totalAmount: 0, remainingAmount: 0 },
            total: { count: 0, totalAmount: 0, remainingAmount: 0 }
        };

        // Tổng hợp kết quả
        statistics.forEach(stat => {
            if (stat._id && result[stat._id]) {
                result[stat._id] = {
                    count: stat.count,
                    totalAmount: stat.totalAmount,
                    remainingAmount: stat.remainingAmount
                };

                // Cập nhật tổng số
                result.total.count += stat.count;
                result.total.totalAmount += stat.totalAmount;
                result.total.remainingAmount += stat.remainingAmount;
            }
        });

        return result;
    } catch (error) {
        logger.error('Error in getLoanStatistics:', error);
        throw error;
    }
};

// Xuất các hàm
export default {
    computeLoanStatuses,
    getUpcomingLoans,
    getLoanStatistics
}; 