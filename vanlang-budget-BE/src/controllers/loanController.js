import mongoose from 'mongoose';
import Loan from '../models/loanModel.js';
import LoanPayment from '../models/loanPaymentModel.js';
import User from '../models/userModel.js';
import Notification from '../models/Notification.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import socketManager from '../utils/socketManager.js';

/**
 * @desc    Lấy tất cả khoản vay của người dùng
 * @route   GET /api/loans
 * @access  Private
 */
export const getLoans = async (req, res, next) => {
    try {
        const { status, limit = 20, page = 1 } = req.query;

        // Xây dựng query filter
        const filter = { userId: req.user.id };

        // Lọc theo trạng thái
        if (status) {
            filter.status = status;
        }

        // Tính pagination
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // Lấy khoản vay và đếm tổng
        const [loans, total] = await Promise.all([
            Loan.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit, 10)),
            Loan.countDocuments(filter),
        ]);

        res.status(200).json({
            status: 'success',
            results: loans.length,
            total,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
            data: loans,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy một khoản vay theo ID
 * @route   GET /api/loans/:id
 * @access  Private
 */
export const getLoan = async (req, res, next) => {
    try {
        const loan = await Loan.findById(req.params.id);

        if (!loan) {
            return next(new AppError('Không tìm thấy khoản vay', 404));
        }

        // Log để debug
        console.log('getLoan - Loan userId:', loan.userId.toString());
        console.log('getLoan - User ID:', req.user.id.toString());
        console.log('getLoan - User role:', req.user.role);

        // Kiểm tra quyền sở hữu - chuyển đổi cả hai giá trị thành string để so sánh
        if (loan.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền truy cập khoản vay này', 403));
        }

        res.status(200).json({
            status: 'success',
            data: loan,
        });
    } catch (error) {
        console.error('getLoan error:', error);
        next(error);
    }
};

/**
 * @desc    Tạo khoản vay mới
 * @route   POST /api/loans
 * @access  Private
 */
export const createLoan = async (req, res, next) => {
    try {
        const {
            amount,
            description,
            startDate,
            dueDate,
            interestRate,
            interestRateType,
            lender,
            status,
            attachments
        } = req.body;

        // Validate dates
        if (new Date(dueDate) <= new Date(startDate)) {
            return next(new AppError('Ngày đáo hạn phải sau ngày bắt đầu', 400));
        }

        // Tạo khoản vay mới
        const newLoan = await Loan.create({
            userId: req.user._id,
            amount,
            description,
            startDate: startDate ? new Date(startDate) : new Date(),
            dueDate: new Date(dueDate),
            interestRate: interestRate || 0,
            interestRateType: interestRateType || 'YEAR',
            lender,
            status: status || 'ACTIVE',
            attachments
        });

        // Tạo thông báo bằng phương thức từ notificationModel
        const notification = await Notification.createLoanNotification(newLoan);

        console.log('Đã tạo thông báo khoản vay mới:', notification);

        // Gửi thông báo qua socket
        if (req.socketManager) {
            // Sử dụng req.socketManager nếu có
            console.log('Gửi loan:create qua req.socketManager');
            req.socketManager.emitLoanCreate(req.user._id, newLoan);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            req.socketManager.sendNotification(req.user._id, notification);
            req.socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản vay',
                notification
            });
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            console.log('Gửi loan:create qua socketManager toàn cục');
            socketManager.emitLoanCreate(req.user._id, newLoan);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            socketManager.sendNotification(req.user._id, notification);
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản vay',
                notification
            });
        }

        res.status(201).json({
            status: 'success',
            data: newLoan,
        });
    } catch (error) {
        console.error('Error creating loan:', error);
        next(error);
    }
};

/**
 * @desc    Cập nhật khoản vay
 * @route   PUT /api/loans/:id
 * @access  Private
 */
export const updateLoan = async (req, res, next) => {
    try {
        console.log('Updating loan with data:', req.body);

        // Tìm khoản vay
        const loan = await Loan.findById(req.params.id);

        if (!loan) {
            return next(new AppError('Không tìm thấy khoản vay', 404));
        }

        // Kiểm tra quyền sở hữu
        if (loan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền cập nhật khoản vay này', 403));
        }

        // Kiểm tra ngày nếu dueDate được cung cấp
        if (req.body.dueDate && req.body.startDate && new Date(req.body.dueDate) <= new Date(req.body.startDate)) {
            return next(new AppError('Ngày đáo hạn phải sau ngày bắt đầu', 400));
        } else if (req.body.dueDate && !req.body.startDate && new Date(req.body.dueDate) <= new Date(loan.startDate)) {
            return next(new AppError('Ngày đáo hạn phải sau ngày bắt đầu', 400));
        }

        // Xóa trường _forceUpdate nếu có trong request
        if (req.body._forceUpdate !== undefined) {
            delete req.body._forceUpdate;
        }

        // Chuẩn hóa trạng thái nếu được cung cấp
        if (req.body.status) {
            const upperStatus = req.body.status.toUpperCase();
            if (['ACTIVE', 'PAID', 'OVERDUE'].includes(upperStatus)) {
                req.body.status = upperStatus;
            } else {
                return next(new AppError('Trạng thái phải là một trong: ACTIVE, PAID, OVERDUE', 400));
            }
        }

        // Lưu trạng thái cũ để so sánh sau khi cập nhật
        const oldStatus = loan.status;
        console.log('Old loan status:', oldStatus);

        console.log('Processed data for update:', req.body);

        // Sử dụng findByIdAndUpdate để cập nhật trực tiếp
        const updatedLoan = await Loan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        console.log('Updated loan:', updatedLoan);

        // Tạo thông báo nếu trạng thái thay đổi
        if (updatedLoan.status.toUpperCase() !== oldStatus.toUpperCase()) {
            console.log(`Status changed from ${oldStatus} to ${updatedLoan.status}`);

            try {
                // Tạo thông báo về thay đổi trạng thái
                const notification = await Notification.createLoanStatusChangeNotification(updatedLoan, oldStatus);
                console.log('Created status change notification:', notification);

                // Gửi thông báo qua socket nếu có
                if (notification && socketManager) {
                    console.log('Sending notification via socket to user:', req.user._id.toString());
                    socketManager.to(req.user._id.toString()).emit('notification', {
                        message: `Trạng thái khoản vay "${updatedLoan.description}" đã thay đổi`,
                        notification
                    });

                    // Đồng thời gửi thông báo chung để cập nhật giao diện
                    socketManager.to(req.user._id.toString()).emit('loan_status_changed', {
                        loanId: updatedLoan._id,
                        oldStatus: oldStatus,
                        newStatus: updatedLoan.status,
                        message: `Trạng thái khoản vay "${updatedLoan.description}" đã thay đổi từ ${oldStatus} thành ${updatedLoan.status}`
                    });
                } else {
                    console.log('No notification created or no socket manager available');
                }
            } catch (notifError) {
                console.error('Error creating status change notification:', notifError);
                // Không dừng luồng xử lý chính nếu tạo thông báo bị lỗi
            }
        }

        // Gửi thông báo qua Socket.io
        if (req.socketManager) {
            // Gửi sự kiện cập nhật khoản vay
            req.socketManager.emitLoanUpdate(req.user._id, updatedLoan);

            // Tạo và gửi thông báo
            const notification = await Notification.createSystemNotification(
                req.user._id.toString(),
                'Cập nhật khoản vay',
                `Bạn đã cập nhật khoản vay: ${updatedLoan.description}`,
                'loan',
                `/loans/${updatedLoan._id}`,
                { model: 'Loan', id: updatedLoan._id },
                updatedLoan._id.toString()
            );

            console.log('Đã tạo thông báo cập nhật khoản vay:', notification);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            req.socketManager.sendNotification(req.user._id, notification);
            req.socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản vay',
                notification
            });
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            console.log('Gửi loan:update qua socketManager toàn cục');
            socketManager.emitLoanUpdate(req.user._id, updatedLoan);

            // Tạo và gửi thông báo
            const notification = await Notification.createSystemNotification(
                req.user._id.toString(),
                'Cập nhật khoản vay',
                `Bạn đã cập nhật khoản vay: ${updatedLoan.description}`,
                'loan',
                `/loans/${updatedLoan._id}`,
                { model: 'Loan', id: updatedLoan._id },
                updatedLoan._id.toString()
            );

            console.log('Đã tạo thông báo cập nhật khoản vay:', notification);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            socketManager.sendNotification(req.user._id, notification);
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản vay',
                notification
            });
        }

        res.status(200).json({
            status: 'success',
            data: updatedLoan,
        });
    } catch (error) {
        console.error('Error updating loan:', error);
        next(error);
    }
};

/**
 * @desc    Xóa một khoản vay
 * @route   DELETE /api/loans/:id
 * @access  Private
 */
export const deleteLoan = async (req, res, next) => {
    try {
        const loan = await Loan.findById(req.params.id);

        if (!loan) {
            return next(new AppError('Không tìm thấy khoản vay', 404));
        }

        // Kiểm tra quyền sở hữu
        if (loan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền xóa khoản vay này', 403));
        }

        // Kiểm tra xem khoản vay đã có lịch sử thanh toán chưa
        const payments = await LoanPayment.countDocuments({ loanId: loan._id });
        if (payments > 0) {
            return next(new AppError('Không thể xóa khoản vay đã có lịch sử thanh toán', 400));
        }

        // Lưu một số thông tin về khoản vay trước khi xóa
        const loanInfo = {
            id: loan._id,
            description: loan.description
        };

        // Xóa khoản vay sử dụng phương thức deleteOne thay vì remove()
        await Loan.deleteOne({ _id: loan._id });

        // Tạo thông báo bằng phương thức chuyên dụng để đảm bảo định dạng đúng
        const notification = await Notification.createSystemNotification(
            req.user._id.toString(),
            'Xóa khoản vay',
            `Bạn đã xóa khoản vay: ${loanInfo.description}`,
            'loan',
            '/loans',
            { model: 'Loan', action: 'delete', id: loanInfo.id },
            loanInfo.id
        );

        console.log('Đã tạo thông báo xóa khoản vay:', notification);

        // Kiểm tra cả socketManager import và req.socketManager
        if (req.socketManager) {
            // Sử dụng req.socketManager nếu có
            console.log('Gửi loan:delete qua req.socketManager');
            req.socketManager.emitLoanDelete(req.user._id, loanInfo.id);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            req.socketManager.sendNotification(req.user._id, notification);
            req.socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản vay',
                notification
            });
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            console.log('Gửi loan:delete qua socketManager toàn cục');
            socketManager.emitLoanDelete(req.user._id, loanInfo.id);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            socketManager.sendNotification(req.user._id, notification);
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản vay',
                notification
            });
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        console.error('deleteLoan error:', error);
        next(error);
    }
};

/**
 * @desc    Lấy thanh toán của một khoản vay
 * @route   GET /api/loans/:id/payments
 * @access  Private
 */
export const getLoanPayments = async (req, res, next) => {
    try {
        const loanId = req.params.id;

        // Kiểm tra khoản vay và quyền sở hữu
        const loan = await Loan.findById(loanId);
        if (!loan) {
            return next(new AppError('Không tìm thấy khoản vay', 404));
        }

        if (loan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền truy cập khoản vay này', 403));
        }

        // Lấy danh sách thanh toán
        const payments = await LoanPayment.find({ loanId })
            .sort({ date: -1 });

        res.status(200).json({
            status: 'success',
            results: payments.length,
            data: payments,
        });
    } catch (error) {
        console.error('getLoanPayments error:', error);
        next(error);
    }
};

/**
 * @desc    Thêm thanh toán cho khoản vay
 * @route   POST /api/loans/:id/payments
 * @access  Private
 */
export const addLoanPayment = async (req, res, next) => {
    try {
        const { amount, paymentDate, description, attachments } = req.body;
        const loanId = req.params.id;

        // Tìm khoản vay
        const loan = await Loan.findById(loanId).populate('payments');
        if (!loan) {
            return next(new AppError('Không tìm thấy khoản vay', 404));
        }

        // Kiểm tra quyền sở hữu
        if (loan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền thêm thanh toán cho khoản vay này', 403));
        }

        // Tạo thanh toán mới
        const newPayment = await LoanPayment.create({
            userId: req.user._id,
            loanId,
            amount,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            description,
            attachments
        });

        // Tạo thông báo về khoản thanh toán
        const notificationPayment = await Notification.createLoanPaymentNotification(newPayment, loan);

        // Gửi thông báo qua socketManager
        if (socketManager && socketManager.to) {
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về thanh toán khoản vay',
                notification: notificationPayment
            });
        }

        // Kiểm tra nếu đã thanh toán hết và tạo thông báo
        const remainingAfterPayment = loan.amount - (loan.totalPaid + amount);
        if (remainingAfterPayment <= 0) {
            const notificationPaid = await Notification.createSystemNotification(
                req.user._id,
                'Khoản vay đã được thanh toán đầy đủ',
                `Khoản vay "${loan.description}" đã được thanh toán đầy đủ.`,
                'SUCCESS',
                `/loans/${loan._id}`,
                { type: 'loan', id: loan._id }
            );

            // Gửi thông báo qua socketManager
            if (socketManager && socketManager.to) {
                socketManager.to(req.user._id.toString()).emit('notification', {
                    message: 'Khoản vay đã thanh toán đầy đủ',
                    notification: notificationPaid
                });
            }

            // Cập nhật trạng thái khoản vay
            loan.status = 'PAID';
            loan.isPaid = true;
            await loan.save();
        }

        res.status(201).json({
            status: 'success',
            data: newPayment,
        });
    } catch (error) {
        console.error('Error adding loan payment:', error);
        next(error);
    }
};

/**
 * @desc    Xóa thanh toán của khoản vay
 * @route   DELETE /api/loans/payments/:id
 * @access  Private
 */
export const deleteLoanPayment = async (req, res, next) => {
    try {
        const paymentId = req.params.id;

        // Tìm thanh toán
        const payment = await LoanPayment.findById(paymentId);
        if (!payment) {
            return next(new AppError('Không tìm thấy thanh toán', 404));
        }

        // Kiểm tra quyền sở hữu
        if (payment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền xóa thanh toán này', 403));
        }

        // Lưu thông tin về thanh toán trước khi xóa
        const paymentInfo = {
            id: payment._id,
            amount: payment.amount
        };

        // Cập nhật khoản vay để trừ đi số tiền đã thanh toán
        const loan = await Loan.findById(payment.loanId);
        if (loan) {
            loan.amountPaid -= payment.amount;

            // Cập nhật trạng thái khoản vay nếu cần
            if (loan.status === 'completed' && loan.amountPaid < loan.amount) {
                const today = new Date();
                const dueDate = new Date(loan.dueDate);

                loan.status = today > dueDate ? 'OVERDUE' : 'ACTIVE';
            }

            await loan.save();
        }

        // Xóa thanh toán sử dụng phương thức deleteOne thay vì remove()
        await LoanPayment.deleteOne({ _id: payment._id });

        if (loan) {
            // Tạo thông báo về xóa thanh toán
            const notification = await Notification.createSystemNotification(
                req.user._id,
                'Xóa thanh toán khoản vay',
                `Bạn đã xóa khoản thanh toán ${paymentInfo.amount} cho khoản vay: ${loan.description}`,
                'WARNING',
                `/loans/${loan._id}`,
                { type: 'loan', id: loan._id }
            );

            console.log('Đã tạo thông báo xóa thanh toán khoản vay:', notification);

            // Thông báo thay đổi trạng thái nếu cần
            let statusChangeNotification = null;
            if (loan.status === 'ACTIVE') {
                statusChangeNotification = await Notification.createSystemNotification(
                    req.user._id,
                    'Khoản vay chưa hoàn tất',
                    `Khoản vay ${loan.description} đã chuyển về trạng thái chưa hoàn tất!`,
                    'WARNING',
                    `/loans/${loan._id}`,
                    { type: 'loan', id: loan._id }
                );
                console.log('Đã tạo thông báo thay đổi trạng thái khoản vay:', statusChangeNotification);
            }

            // Kiểm tra cả socketManager import và req.socketManager
            if (req.socketManager) {
                // Sử dụng req.socketManager nếu có
                console.log('Sử dụng req.socketManager để gửi thông báo');
                req.socketManager.emitLoanPaymentDelete(req.user._id, paymentInfo.id, loan);
                req.socketManager.to(req.user._id.toString()).emit('notification', {
                    message: 'Bạn có thông báo mới về xóa thanh toán khoản vay',
                    notification: notification
                });

                // Gửi thông báo thay đổi trạng thái nếu có
                if (statusChangeNotification) {
                    req.socketManager.to(req.user._id.toString()).emit('notification', {
                        message: 'Bạn có thông báo mới về thay đổi trạng thái khoản vay',
                        notification: statusChangeNotification
                    });
                }
            } else if (socketManager) {
                // Fallback vào socketManager import nếu không có req.socketManager
                console.log('Sử dụng socketManager import để gửi thông báo');
                socketManager.emitLoanPaymentDelete(req.user._id, paymentInfo.id, loan);
                socketManager.to(req.user._id.toString()).emit('notification', {
                    message: 'Bạn có thông báo mới về xóa thanh toán khoản vay',
                    notification: notification
                });

                // Gửi thông báo thay đổi trạng thái nếu có
                if (statusChangeNotification) {
                    socketManager.to(req.user._id.toString()).emit('notification', {
                        message: 'Bạn có thông báo mới về thay đổi trạng thái khoản vay',
                        notification: statusChangeNotification
                    });
                }
            }
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        console.error('deleteLoanPayment error:', error);
        next(error);
    }
}; 