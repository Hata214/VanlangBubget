import Income from '../models/incomeModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import socketManager from '../utils/socketManager.js';
import IncomeCategory from '../models/incomeCategoryModel.js';
import { formatCategoryName } from '../utils/helpers.js';

/**
 * @desc    Lấy tất cả thu nhập của người dùng
 * @route   GET /api/incomes
 * @access  Private
 */
export const getIncomes = async (req, res, next) => {
    try {
        console.log('getIncomes - User:', req.user._id.toString());

        // Lọc các query params cho phép - bỏ qua các params không liên quan
        const { startDate, endDate, category, categories, group, limit = 50, page = 1 } = req.query;

        // Loại bỏ các query params không an toàn hoặc không cần thiết
        console.log('getIncomes - Original query params:', JSON.stringify(req.query));
        console.log('getIncomes - Filtered query params:', JSON.stringify({ startDate, endDate, category, categories, group, limit, page }));

        // Xây dựng query filter
        const filter = { userId: req.user._id };
        console.log('getIncomes - Filter:', JSON.stringify(filter));

        // Lọc theo ngày
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        // Lọc theo danh mục và nhóm danh mục
        if (group) {
            // Nếu lọc theo nhóm, cần tìm tất cả danh mục thuộc nhóm đó
            const groupCategories = await IncomeCategory.find({
                userId: req.user._id,
                group: group
            }).select('_id');

            if (groupCategories && groupCategories.length > 0) {
                // Lấy mảng ID của các danh mục thuộc nhóm
                const groupCategoryIds = groupCategories.map(cat => cat._id);
                filter.category = { $in: groupCategoryIds };
            }
        }
        // Hỗ trợ lọc theo danh mục cũ (tương thích ngược)
        // VD: Nếu chọn "Lương" thì cũng sẽ lấy cả các khoản thu nhập thuộc danh mục "SALARY"
        else if (category) {
            // Tìm danh mục được chọn
            const selectedCategory = await IncomeCategory.findById(category);

            if (selectedCategory) {
                // Nếu danh mục này thuộc một nhóm nào đó
                if (selectedCategory.group) {
                    // Tìm tất cả danh mục cùng nhóm
                    const relatedCategories = await IncomeCategory.find({
                        userId: req.user._id,
                        group: selectedCategory.group
                    }).select('_id');

                    if (relatedCategories && relatedCategories.length > 0) {
                        const relatedCategoryIds = relatedCategories.map(cat => cat._id);
                        filter.category = { $in: relatedCategoryIds };
                    } else {
                        filter.category = category;
                    }
                } else {
                    filter.category = category;
                }
            } else {
                filter.category = category;
            }
        }
        // Lọc theo nhiều danh mục
        else if (categories) {
            // Nếu categories là một mảng (từ query ?categories=A&categories=B)
            if (Array.isArray(categories)) {
                filter.category = { $in: categories };
            }
            // Nếu categories là một chuỗi phân tách bởi dấu phẩy (từ query ?categories=A,B,C)
            else if (typeof categories === 'string' && categories.includes(',')) {
                filter.category = { $in: categories.split(',') };
            }
            // Nếu categories là một chuỗi đơn (từ query ?categories=A)
            else {
                filter.category = categories;
            }
        }

        // Tính pagination
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // Lấy thu nhập và đếm tổng
        const [incomes, total] = await Promise.all([
            Income.find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit, 10))
                .populate('category', 'name icon color group'), // Thêm populate để lấy thông tin danh mục
            Income.countDocuments(filter),
        ]);

        console.log(`getIncomes - Found ${incomes.length} incomes`);
        console.log('getIncomes - Applied filter:', JSON.stringify(filter));

        // Biến đổi dữ liệu để phù hợp với format frontend
        const formattedIncomes = incomes.map(income => {
            // Chuyển đổi mongoose document thành JavaScript object
            const incomeObj = income.toObject();

            // Đảm bảo _id được chuyển thành id
            incomeObj.id = incomeObj._id.toString();

            // Thêm thông tin về group của danh mục (nếu có)
            if (income.category && typeof income.category === 'object') {
                incomeObj.categoryGroup = income.category.group;
                // Sử dụng hàm helper từ utils/helpers.js để định dạng tên danh mục
                incomeObj.category = formatCategoryName(income.category);
            }

            return incomeObj;
        });

        // Log dữ liệu đã được format
        console.log(`getIncomes - Formatted ${formattedIncomes.length} incomes for frontend`);

        // Tính tổng thu nhập từ TẤT CẢ records (không chỉ từ page hiện tại)
        const totalAmountResult = await Income.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;
        console.log(`getIncomes - Total income amount (ALL records): ${totalAmount}`);

        res.status(200).json({
            status: 'success',
            results: formattedIncomes.length,
            total,
            totalAmount,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
            data: formattedIncomes,
        });
    } catch (error) {
        console.error('getIncomes error:', error);
        next(error);
    }
};

/**
 * @desc    Lấy một thu nhập theo ID
 * @route   GET /api/incomes/:id
 * @access  Private
 */
export const getIncome = async (req, res, next) => {
    try {
        const income = await Income.findById(req.params.id);

        if (!income) {
            return next(new AppError('Không tìm thấy thu nhập', 404));
        }

        // Log để debug
        console.log('getIncome - Income userId:', income.userId.toString());
        console.log('getIncome - User ID:', req.user._id.toString());
        console.log('getIncome - User role:', req.user.role);

        // Kiểm tra quyền sở hữu - chuyển đổi cả hai giá trị thành string để so sánh
        if (income.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền truy cập thu nhập này', 403));
        }

        res.status(200).json({
            status: 'success',
            data: income,
        });
    } catch (error) {
        console.error('getIncome error:', error);
        next(error);
    }
};

/**
 * @desc    Tạo thu nhập mới
 * @route   POST /api/incomes
 * @access  Private
 */
export const createIncome = async (req, res, next) => {
    // AGENT INTERACTION: Đây là điểm bắt đầu của hàm xử lý yêu cầu thêm thu nhập mới từ agent.
    try {
        const { amount, description, category, date, attachments } = req.body;

        // Chuyển đổi danh mục tiếng Anh sang tiếng Việt
        let updatedCategory = category;
        if (category === 'SALARY') {
            updatedCategory = 'Lương';
        } else if (category === 'BONUS') {
            updatedCategory = 'Thưởng';
        } else if (category === 'INVESTMENT') {
            updatedCategory = 'Đầu tư';
        } else if (category === 'OTHER' || category === 'Khác') {
            updatedCategory = 'Lương'; // Sử dụng danh mục Lương thay cho Khác
        }

        // Tạo thu nhập mới
        const newIncome = await Income.create({
            userId: req.user._id,
            amount,
            description,
            category: updatedCategory,
            date: date ? new Date(date) : new Date(),
            attachments,
        });

        // AGENT INTERACTION: Sau khi tạo thu nhập, agent có thể xử lý newIncome tại đây.
        // Tạo thông báo bằng phương thức từ notificationModel
        const notification = await Notification.createIncomeNotification(newIncome);

        // Gửi thông báo qua socketManager (từ middleware)
        if (socketManager && socketManager.to) {
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản thu nhập',
                notification
            });
        }

        res.status(201).json({
            status: 'success',
            data: newIncome,
        });
    } catch (error) {
        console.error('createIncome error:', error);
        next(error);
    }
};

/**
 * @desc    Cập nhật thu nhập
 * @route   PUT /api/incomes/:id
 * @access  Private
 */
export const updateIncome = async (req, res, next) => {
    try {
        const { amount, description, category, date, attachments } = req.body;

        // Tìm thu nhập
        const income = await Income.findById(req.params.id);

        if (!income) {
            return next(new AppError('Không tìm thấy thu nhập', 404));
        }

        // Log để debug
        console.log('updateIncome - Income userId:', income.userId.toString());
        console.log('updateIncome - User ID:', req.user._id.toString());
        console.log('updateIncome - User role:', req.user.role);

        // Kiểm tra quyền sở hữu - chuyển đổi cả hai giá trị thành string để so sánh
        if (income.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền cập nhật thu nhập này', 403));
        }

        // Chuyển đổi danh mục tiếng Anh sang tiếng Việt
        let updatedCategory = category;
        if (category) {
            if (category === 'SALARY') {
                updatedCategory = 'Lương';
            } else if (category === 'BONUS') {
                updatedCategory = 'Thưởng';
            } else if (category === 'INVESTMENT') {
                updatedCategory = 'Đầu tư';
            } else if (category === 'OTHER' || category === 'Khác') {
                updatedCategory = 'Lương'; // Sử dụng danh mục Lương thay cho Khác
            }
        }

        // Cập nhật trường cho phép
        if (amount !== undefined) income.amount = amount;
        if (description) income.description = description;
        if (category) income.category = updatedCategory;
        if (date) income.date = new Date(date);
        if (attachments) income.attachments = attachments;

        // Lưu thay đổi
        await income.save();

        // Tạo thông báo bằng phương thức chuyên dụng để đảm bảo định dạng đúng
        const notification = await Notification.createSystemNotification(
            income.userId.toString(),
            'Cập nhật thu nhập',
            `Bạn đã cập nhật khoản thu nhập: ${income.description || income.category}`,
            'income',
            `/incomes?highlight=${income._id}`,
            { model: 'Income', id: income._id },
            income._id.toString()
        );

        console.log('Đã tạo thông báo cập nhật thu nhập:', notification);

        // Kiểm tra cả socketManager import và req.socketManager
        if (req.socketManager) {
            // Sử dụng req.socketManager nếu có
            console.log('Gửi income:update qua req.socketManager');
            req.socketManager.emitIncomeUpdate(req.user._id, income);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            req.socketManager.sendNotification(req.user._id, notification);
            req.socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản thu nhập',
                notification
            });
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            console.log('Gửi income:update qua socketManager toàn cục');
            socketManager.emitIncomeUpdate(req.user._id, income);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            socketManager.sendNotification(req.user._id, notification);
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản thu nhập',
                notification
            });
        }

        res.status(200).json({
            status: 'success',
            data: income,
        });
    } catch (error) {
        console.error('updateIncome error:', error);
        next(error);
    }
};

/**
 * @desc    Xóa thu nhập
 * @route   DELETE /api/incomes/:id
 * @access  Private
 */
export const deleteIncome = async (req, res, next) => {
    try {
        const income = await Income.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!income) {
            return next(new AppError('Không tìm thấy khoản thu nhập này', 404));
        }

        // Chuẩn bị thông tin để gửi thông báo
        const incomeInfo = {
            id: income._id,
            description: income.description
        };

        // Sử dụng findByIdAndDelete thay vì income.remove()
        await Income.findByIdAndDelete(req.params.id);

        // Gửi thông báo qua Socket.io
        // Kiểm tra cả socketManager import và req.socketManager
        if (req.socketManager && req.socketManager.emitIncomeDelete) {
            // Sử dụng socketManager từ middleware
            req.socketManager.emitIncomeDelete(req.user._id, incomeInfo.id);

            // Tạo và gửi thông báo
            const notification = {
                userId: req.user._id,
                title: 'Xóa thu nhập',
                message: `Bạn đã xóa khoản thu nhập: ${incomeInfo.description}`,
                type: 'income'
            };

            req.socketManager.sendNotification(req.user._id, notification);
        } else if (socketManager && socketManager.emitIncomeDelete) {
            // Fallback vào socketManager import nếu không có req.socketManager
            socketManager.emitIncomeDelete(req.user._id, incomeInfo.id);

            // Tạo và gửi thông báo
            const notification = {
                userId: req.user._id,
                title: 'Xóa thu nhập',
                message: `Bạn đã xóa khoản thu nhập: ${incomeInfo.description}`,
                type: 'income'
            };

            socketManager.sendNotification(req.user._id, notification);
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        console.error('deleteIncome error:', error);
        next(error);
    }
};

/**
 * @desc    Lấy tổng thu nhập theo tháng
 * @route   GET /api/incomes/summary/monthly
 * @access  Private
 */
export const getMonthlyTotal = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        // Kiểm tra tham số bắt buộc
        if (!month || !year) {
            return next(new AppError('Vui lòng cung cấp tháng và năm', 400));
        }

        // Chuyển đổi sang số
        const numMonth = parseInt(month, 10);
        const numYear = parseInt(year, 10);

        const total = await Income.getMonthlyTotal(req.user._id, numMonth, numYear);

        res.status(200).json({
            status: 'success',
            data: {
                month: numMonth,
                year: numYear,
                total,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy tổng thu nhập theo danh mục và tháng
 * @route   GET /api/incomes/summary/by-category
 * @access  Private
 */
export const getTotalByCategory = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        // Kiểm tra tham số bắt buộc
        if (!month || !year) {
            return next(new AppError('Vui lòng cung cấp tháng và năm', 400));
        }

        // Chuyển đổi sang số
        const numMonth = parseInt(month, 10);
        const numYear = parseInt(year, 10);

        const result = await Income.getMonthlyTotalByCategory(
            req.user._id,
            numMonth,
            numYear
        );

        res.status(200).json({
            status: 'success',
            results: result.length,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};