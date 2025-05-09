import cron from 'node-cron';
import Loan from '../models/loanModel.js';
import Notification from '../models/Notification.js';
import logger from './logger.js';
import Budget from '../models/Budget.js';

/**
 * Kiểm tra các khoản vay quá hạn và tạo thông báo
 */
async function checkOverdueLoans() {
    try {
        logger.info('Đang chạy tác vụ kiểm tra khoản vay quá hạn');

        // Lấy ngày hiện tại và reset giờ để so sánh chỉ ngày tháng năm
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tìm tất cả khoản vay chưa trả hết với dueDate <= today, trạng thái active, và chưa có thông báo quá hạn
        const overdueLoans = await Loan.find({
            isPaid: false,
            dueDate: { $lte: today },
            status: 'active',
            hasOverdueNotification: { $ne: true } // Chỉ kiểm tra các khoản chưa có thông báo quá hạn
        }).populate('userId', 'email username');

        logger.info(`Tìm thấy ${overdueLoans.length} khoản vay quá hạn cần gửi thông báo`);

        for (const loan of overdueLoans) {
            // Tạo thông báo cho mỗi khoản vay quá hạn
            const notification = await Notification.createSystemNotification(
                loan.userId._id,
                'Khoản vay quá hạn',
                `Khoản vay ${loan.description} đã quá hạn thanh toán vào ngày ${loan.dueDate.toLocaleDateString('vi-VN')}`,
                'warning',
                `/loans/${loan._id}`,
                { type: 'loan', id: loan._id }
            );

            // Cập nhật loan để đánh dấu đã tạo thông báo quá hạn
            await Loan.findByIdAndUpdate(loan._id, { hasOverdueNotification: true });

            // Gửi thông báo qua socket sẽ được xử lý tự động bởi middleware

            logger.info(`Đã tạo thông báo quá hạn cho khoản vay: ${loan._id}`);
        }
    } catch (error) {
        logger.error('Lỗi khi kiểm tra khoản vay quá hạn:', error);
    }
}

/**
 * Kiểm tra các khoản vay sắp đến hạn và tạo thông báo nhắc nhở
 */
async function checkUpcomingDueLoans() {
    try {
        logger.info('Đang chạy tác vụ kiểm tra khoản vay sắp đến hạn');

        // Lấy ngày hiện tại
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tính ngày 3 ngày sau
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);

        // Tìm tất cả khoản vay chưa trả hết với dueDate = 3 ngày sau, chưa có thông báo nhắc nhở
        const upcomingLoans = await Loan.find({
            isPaid: false,
            dueDate: {
                $gt: today,
                $lte: threeDaysLater
            },
            status: 'active',
            hasReminderNotification: { $ne: true } // Chỉ kiểm tra các khoản chưa có thông báo nhắc nhở
        }).populate('userId', 'email username');

        logger.info(`Tìm thấy ${upcomingLoans.length} khoản vay sắp đến hạn cần gửi thông báo`);

        for (const loan of upcomingLoans) {
            // Tạo thông báo cho mỗi khoản vay sắp đến hạn
            const notification = await Notification.createSystemNotification(
                loan.userId._id,
                'Khoản vay sắp đến hạn',
                `Khoản vay ${loan.description} sẽ đến hạn vào ngày ${loan.dueDate.toLocaleDateString('vi-VN')}`,
                'info',
                `/loans/${loan._id}`,
                { type: 'loan', id: loan._id }
            );

            // Cập nhật loan để đánh dấu đã tạo thông báo nhắc nhở
            await Loan.findByIdAndUpdate(loan._id, { hasReminderNotification: true });

            // Gửi thông báo qua socket sẽ được xử lý tự động bởi middleware

            logger.info(`Đã tạo thông báo nhắc nhở cho khoản vay: ${loan._id}`);
        }
    } catch (error) {
        logger.error('Lỗi khi kiểm tra khoản vay sắp đến hạn:', error);
    }
}

/**
 * Khởi tạo tất cả các tác vụ cron
 */
function initCronJobs() {
    // Chạy tác vụ kiểm tra khoản vay quá hạn mỗi ngày lúc 8 giờ sáng
    cron.schedule('0 8 * * *', checkOverdueLoans);

    // Chạy tác vụ kiểm tra khoản vay sắp đến hạn mỗi ngày lúc 9 giờ sáng
    cron.schedule('0 9 * * *', checkUpcomingDueLoans);

    // Chạy lần đầu tiên khi server khởi động (sau 10 giây)
    setTimeout(() => {
        checkOverdueLoans();
        checkUpcomingDueLoans();
        logger.info('Đã chạy tác vụ kiểm tra khoản vay khi khởi động server');
    }, 10000);

    logger.info('Đã khởi tạo các tác vụ định kỳ');
}

export { initCronJobs, checkOverdueLoans, checkUpcomingDueLoans };