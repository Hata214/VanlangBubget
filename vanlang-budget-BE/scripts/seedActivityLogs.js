import mongoose from 'mongoose';
import AdminActivityLog from '../src/models/adminActivityLogModel.js';
import User from '../src/models/userModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Script để tạo sample activity logs cho testing
 */
async function seedActivityLogs() {
    try {
        console.log('🔄 Bắt đầu seed activity logs...');
        console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB');

        // Lấy danh sách admin users
        const adminUsers = await User.find({
            role: { $in: ['admin', 'superadmin'] }
        }).select('_id firstName lastName email role');

        console.log(`📋 Tìm thấy ${adminUsers.length} admin users:`,
            adminUsers.map(u => `${u.firstName} ${u.lastName} (${u.role})`));

        if (adminUsers.length === 0) {
            console.log('❌ Không tìm thấy admin users nào!');
            return;
        }

        // Xóa logs cũ (optional)
        const deleteResult = await AdminActivityLog.deleteMany({});
        console.log(`🗑️ Đã xóa ${deleteResult.deletedCount} logs cũ`);

        // Tạo sample activity logs
        const sampleLogs = [];
        const actionTypes = [
            'LOGIN',
            'LOGOUT',
            'DASHBOARD_VIEW',
            'USER_VIEW',
            'USER_CREATE',
            'USER_UPDATE',
            'USER_DELETE',
            'CONTENT_UPDATE',
            'EXPORT_DATA'
        ];

        const targetTypes = ['User', 'SiteContent', 'System', 'Admin'];

        // Tạo 50 logs mẫu
        for (let i = 0; i < 50; i++) {
            const randomAdmin = adminUsers[Math.floor(Math.random() * adminUsers.length)];
            const randomAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
            const randomTargetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];

            // Tạo timestamp ngẫu nhiên trong 30 ngày qua
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

            const logData = {
                adminId: randomAdmin._id,
                actionType: randomAction,
                targetType: randomTargetType,
                result: Math.random() > 0.1 ? 'SUCCESS' : 'FAILED', // 90% success rate
                timestamp: randomDate,
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                inputData: {
                    action: randomAction,
                    timestamp: randomDate.toISOString(),
                    userRole: randomAdmin.role
                },
                metadata: {
                    source: 'seed-script',
                    adminName: `${randomAdmin.firstName} ${randomAdmin.lastName}`,
                    adminEmail: randomAdmin.email
                }
            };

            // Thêm targetId cho một số actions
            if (['USER_VIEW', 'USER_UPDATE', 'USER_DELETE'].includes(randomAction)) {
                logData.targetId = randomAdmin._id; // Sử dụng admin ID làm target
                logData.resultDetails = `Thao tác ${randomAction} trên user ${randomAdmin.email}`;
            }

            sampleLogs.push(logData);
        }

        // Insert logs vào database
        const insertResult = await AdminActivityLog.insertMany(sampleLogs);
        console.log(`✅ Đã tạo ${insertResult.length} activity logs mẫu`);

        // Hiển thị thống kê
        const stats = await AdminActivityLog.aggregate([
            {
                $group: {
                    _id: '$actionType',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        console.log('\n📊 Thống kê logs theo action type:');
        stats.forEach(stat => {
            console.log(`  ${stat._id}: ${stat.count} logs`);
        });

        // Hiển thị logs mới nhất
        const latestLogs = await AdminActivityLog.find()
            .populate('adminId', 'firstName lastName email role')
            .sort({ timestamp: -1 })
            .limit(5);

        console.log('\n🕒 5 logs mới nhất:');
        latestLogs.forEach(log => {
            const admin = log.adminId;
            console.log(`  ${log.timestamp.toISOString()} - ${admin?.firstName} ${admin?.lastName} (${admin?.role}) - ${log.actionType} - ${log.result}`);
        });

        console.log('\n🎉 Seed activity logs hoàn thành!');

    } catch (error) {
        console.error('❌ Lỗi khi seed activity logs:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

// Chạy script
seedActivityLogs();
