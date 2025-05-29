import Loan from '../models/loanModel.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import { emit } from '../socket.js';

/**
 * Tính toán và cập nhật trạng thái cho các khoản vay với real-time notifications
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
            updated: 0,
            statusChanges: []
        };

        // Lấy tất cả các khoản vay chưa hoàn thành, bao gồm thông tin user
        const loans = await Loan.find({
            status: { $nin: ['PAID', 'paid'] }
        }).populate('userId', 'fullName email');

        result.total = loans.length;

        for (const loan of loans) {
            const oldStatus = loan.status;
            let statusChanged = false;
            let newStatus = oldStatus;

            // Kiểm tra nếu khoản vay đã trả hết
            if (loan.totalPaid >= loan.amount) {
                newStatus = 'PAID';
                loan.status = 'PAID';
                loan.isPaid = true;
                statusChanged = true;
                result.paid++;
            }
            // Kiểm tra nếu khoản vay quá hạn
            else if (loan.dueDate < today && loan.status?.toUpperCase() !== 'OVERDUE') {
                newStatus = 'OVERDUE';
                loan.status = 'OVERDUE';
                loan.isPaid = false;
                statusChanged = true;
                result.overdue++;
            }
            // Khoản vay đang hoạt động bình thường
            else if (loan.status?.toUpperCase() === 'ACTIVE') {
                result.active++;
            }

            // Lưu lại nếu có sự thay đổi về trạng thái
            if (statusChanged) {
                await loan.save();
                result.updated++;

                // Ghi lại thay đổi trạng thái
                const statusChange = {
                    loanId: loan._id,
                    userId: loan.userId?._id || loan.userId,
                    oldStatus,
                    newStatus,
                    description: loan.description,
                    amount: loan.amount,
                    dueDate: loan.dueDate
                };
                result.statusChanges.push(statusChange);

                // Tạo thông báo cho người dùng
                let notificationTitle, notificationMessage, notificationType;

                if (newStatus === 'PAID') {
                    notificationTitle = 'Khoản vay đã hoàn tất';
                    notificationMessage = `Khoản vay "${loan.description}" đã được thanh toán đầy đủ.`;
                    notificationType = 'success';
                } else if (newStatus === 'OVERDUE') {
                    notificationTitle = 'Khoản vay quá hạn';
                    notificationMessage = `Khoản vay "${loan.description}" đã quá hạn thanh toán.`;
                    notificationType = 'warning';
                }

                // Tạo thông báo trong database
                const notification = await Notification.createSystemNotification(
                    loan.userId?._id || loan.userId,
                    notificationTitle,
                    notificationMessage,
                    notificationType,
                    `/loans/${loan._id}`,
                    { type: 'loan', id: loan._id }
                );

                // Gửi thông báo real-time qua socket
                if (loan.userId?._id || loan.userId) {
                    const userId = (loan.userId?._id || loan.userId).toString();

                    // Gửi thông báo chung
                    emit(userId, 'notification', notification);

                    // Gửi thông báo thay đổi trạng thái khoản vay
                    emit(userId, 'loan_status_changed', {
                        loanId: loan._id,
                        oldStatus,
                        newStatus,
                        message: notificationMessage,
                        loan: {
                            id: loan._id,
                            description: loan.description,
                            amount: loan.amount,
                            status: newStatus,
                            dueDate: loan.dueDate
                        }
                    });

                    logger.info(`Real-time notification sent for loan status change: ${loan._id} (${oldStatus} -> ${newStatus})`);
                }
            }
        }

        logger.info(`Loan status computation completed: ${result.updated} loans updated, ${result.statusChanges.length} status changes`);
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
                        { userId: new mongoose.Types.ObjectId(userId) },
                        { user: new mongoose.Types.ObjectId(userId) }
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

/**
 * Kiểm tra và cập nhật trạng thái khoản vay real-time cho một user cụ thể
 * @param {String} userId - ID của người dùng
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export const checkAndUpdateUserLoanStatuses = async (userId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = {
            total: 0,
            updated: 0,
            statusChanges: []
        };

        // Lấy các khoản vay của user chưa hoàn thành
        const loans = await Loan.find({
            $or: [
                { userId: new mongoose.Types.ObjectId(userId) },
                { user: new mongoose.Types.ObjectId(userId) }
            ],
            status: { $nin: ['PAID', 'paid'] }
        });

        result.total = loans.length;

        for (const loan of loans) {
            const oldStatus = loan.status;
            let statusChanged = false;
            let newStatus = oldStatus;

            // Kiểm tra nếu khoản vay đã trả hết
            if (loan.totalPaid >= loan.amount) {
                newStatus = 'PAID';
                loan.status = 'PAID';
                loan.isPaid = true;
                statusChanged = true;
            }
            // Kiểm tra nếu khoản vay quá hạn
            else if (loan.dueDate < today && loan.status?.toUpperCase() !== 'OVERDUE') {
                newStatus = 'OVERDUE';
                loan.status = 'OVERDUE';
                loan.isPaid = false;
                statusChanged = true;
            }

            if (statusChanged) {
                await loan.save();
                result.updated++;

                const statusChange = {
                    loanId: loan._id,
                    oldStatus,
                    newStatus,
                    description: loan.description,
                    amount: loan.amount,
                    dueDate: loan.dueDate
                };
                result.statusChanges.push(statusChange);

                // Gửi thông báo real-time
                emit(userId, 'loan_status_changed', {
                    loanId: loan._id,
                    oldStatus,
                    newStatus,
                    loan: {
                        id: loan._id,
                        description: loan.description,
                        amount: loan.amount,
                        status: newStatus,
                        dueDate: loan.dueDate
                    }
                });

                logger.info(`User ${userId} loan status updated: ${loan._id} (${oldStatus} -> ${newStatus})`);
            }
        }

        return result;
    } catch (error) {
        logger.error('Error in checkAndUpdateUserLoanStatuses:', error);
        throw error;
    }
};

/**
 * Kiểm tra trạng thái khoản vay real-time (chạy mỗi phút)
 * @returns {Promise<Object>} Kết quả kiểm tra
 */
export const realTimeStatusCheck = async () => {
    try {
        const today = new Date();
        const result = {
            checked: 0,
            updated: 0,
            statusChanges: []
        };

        // Lấy các khoản vay có thể thay đổi trạng thái
        const loans = await Loan.find({
            $or: [
                // Khoản vay có thể quá hạn
                {
                    status: { $in: ['ACTIVE', 'active'] },
                    dueDate: { $lt: today }
                },
                // Khoản vay có thể đã trả xong
                {
                    status: { $nin: ['PAID', 'paid'] },
                    $expr: { $gte: ['$totalPaid', '$amount'] }
                }
            ]
        }).populate('userId', 'fullName email');

        result.checked = loans.length;

        for (const loan of loans) {
            const oldStatus = loan.status;
            let statusChanged = false;
            let newStatus = oldStatus;

            // Kiểm tra logic cập nhật trạng thái
            if (loan.totalPaid >= loan.amount && loan.status?.toUpperCase() !== 'PAID') {
                newStatus = 'PAID';
                loan.status = 'PAID';
                loan.isPaid = true;
                statusChanged = true;
            } else if (loan.dueDate < today && loan.status?.toUpperCase() !== 'OVERDUE') {
                newStatus = 'OVERDUE';
                loan.status = 'OVERDUE';
                loan.isPaid = false;
                statusChanged = true;
            }

            if (statusChanged) {
                await loan.save();
                result.updated++;

                const statusChange = {
                    loanId: loan._id,
                    userId: loan.userId?._id || loan.userId,
                    oldStatus,
                    newStatus,
                    description: loan.description
                };
                result.statusChanges.push(statusChange);

                // Gửi thông báo real-time
                if (loan.userId?._id || loan.userId) {
                    const userId = (loan.userId?._id || loan.userId).toString();

                    emit(userId, 'loan_status_changed', {
                        loanId: loan._id,
                        oldStatus,
                        newStatus,
                        loan: {
                            id: loan._id,
                            description: loan.description,
                            amount: loan.amount,
                            status: newStatus,
                            dueDate: loan.dueDate
                        }
                    });
                }
            }
        }

        if (result.updated > 0) {
            logger.info(`Real-time status check: ${result.updated} loans updated`);
        }

        return result;
    } catch (error) {
        logger.error('Error in realTimeStatusCheck:', error);
        throw error;
    }
};

// Xuất các hàm
export default {
    computeLoanStatuses,
    getUpcomingLoans,
    getLoanStatistics,
    checkAndUpdateUserLoanStatuses,
    realTimeStatusCheck
};