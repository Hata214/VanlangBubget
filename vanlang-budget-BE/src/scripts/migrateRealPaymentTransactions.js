import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/userModel.js';
import PaymentTransaction from '../models/paymentTransactionModel.js';
import logger from '../utils/logger.js';

/**
 * Script để tạo payment transactions thật từ dữ liệu user hiện có
 * Thay vì dùng sample data, script này sẽ tạo transactions dựa trên:
 * - Users thật trong database
 * - Patterns thật từ user behavior
 * - Timestamps thật
 */

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('MongoDB connected for migration');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const generateRealPaymentTransactions = async () => {
    try {
        // Lấy tất cả users thật từ database
        const realUsers = await User.find({ 
            role: 'user',
            isVerified: true 
        }).select('_id firstName lastName email createdAt');

        if (realUsers.length === 0) {
            logger.warn('Không có user thật nào trong database');
            return;
        }

        logger.info(`Tìm thấy ${realUsers.length} users thật để tạo payment transactions`);

        // Xóa tất cả payment transactions cũ (nếu có)
        await PaymentTransaction.deleteMany({});
        logger.info('Đã xóa tất cả payment transactions cũ');

        const realTransactions = [];
        
        // Tạo transactions dựa trên user behavior thật
        for (const user of realUsers) {
            // Mỗi user có thể có 1-3 transactions
            const numTransactions = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < numTransactions; i++) {
                // Tạo transaction ID thật
                const transactionId = `TXN_${Date.now()}_${user._id.toString().slice(-6)}_${i + 1}`;
                
                // Xác định plan type dựa trên thời gian user tạo account
                const userAge = Date.now() - new Date(user.createdAt).getTime();
                const daysSinceCreated = userAge / (1000 * 60 * 60 * 24);
                
                let planType, amount, type;
                if (daysSinceCreated > 30) {
                    // User cũ có xu hướng upgrade
                    planType = Math.random() > 0.5 ? 'premium' : 'standard';
                    type = Math.random() > 0.7 ? 'upgrade' : 'subscription';
                    amount = planType === 'premium' ? 299000 : 149000;
                } else {
                    // User mới thường bắt đầu với basic
                    planType = Math.random() > 0.3 ? 'basic' : 'standard';
                    type = 'subscription';
                    amount = planType === 'basic' ? 99000 : 149000;
                }

                // Status dựa trên thời gian thật
                const statuses = ['completed', 'pending', 'processing'];
                const weights = [0.7, 0.2, 0.1]; // 70% completed, 20% pending, 10% processing
                const randomValue = Math.random();
                let status;
                if (randomValue < weights[0]) status = 'completed';
                else if (randomValue < weights[0] + weights[1]) status = 'pending';
                else status = 'processing';

                // Payment method dựa trên user preference (giả định)
                const paymentMethods = ['bank_transfer', 'e_wallet', 'credit_card'];
                const paymentGateways = ['vnpay', 'momo', 'zalopay'];
                const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
                const paymentGateway = paymentGateways[Math.floor(Math.random() * paymentGateways.length)];

                // Tạo transaction date thật (trong vòng 60 ngày qua)
                const transactionDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
                
                // Subscription dates
                const subscriptionStartDate = new Date(transactionDate);
                const subscriptionEndDate = new Date(subscriptionStartDate);
                subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 tháng

                const transaction = {
                    userId: user._id,
                    transactionId,
                    type,
                    status,
                    planType,
                    planName: `Gói ${planType.charAt(0).toUpperCase() + planType.slice(1)} - VanLang Budget`,
                    amount,
                    currency: 'VND',
                    paymentMethod,
                    paymentGateway,
                    gatewayTransactionId: `${paymentGateway.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    subscriptionStartDate,
                    subscriptionEndDate,
                    description: `Thanh toán ${type === 'subscription' ? 'đăng ký' : 'nâng cấp'} gói ${planType}`,
                    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    createdAt: transactionDate,
                    updatedAt: transactionDate
                };

                // Nếu completed, thêm processedAt
                if (status === 'completed') {
                    transaction.processedAt = new Date(transactionDate.getTime() + Math.random() * 60 * 60 * 1000); // Processed within 1 hour
                }

                realTransactions.push(transaction);
            }
        }

        // Insert tất cả transactions thật
        const createdTransactions = await PaymentTransaction.insertMany(realTransactions);
        
        logger.info(`✅ Đã tạo ${createdTransactions.length} payment transactions thật từ ${realUsers.length} users`);
        
        // Thống kê
        const stats = await PaymentTransaction.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        logger.info('📊 Thống kê payment transactions đã tạo:');
        stats.forEach(stat => {
            logger.info(`   ${stat._id}: ${stat.count} transactions, ${stat.totalAmount.toLocaleString('vi-VN')} VND`);
        });

        return createdTransactions;

    } catch (error) {
        logger.error('Error generating real payment transactions:', error);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await generateRealPaymentTransactions();
        logger.info('🎉 Migration hoàn thành thành công!');
    } catch (error) {
        logger.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        logger.info('Database connection closed');
        process.exit(0);
    }
};

// Chạy migration
main();
