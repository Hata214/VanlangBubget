const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const addTestSavingsData = async () => {
    try {
        // Kết nối database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define models inline
        const userSchema = new mongoose.Schema({
            email: String,
            password: String,
            firstName: String,
            lastName: String
        }, { timestamps: true });

        const incomeSchema = new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            amount: { type: Number, required: true },
            description: { type: String, required: true },
            category: { type: String, required: true },
            date: { type: Date, default: Date.now }
        }, { timestamps: true });

        const User = mongoose.model('User', userSchema);
        const Income = mongoose.model('Income', incomeSchema);

        // Tìm user đầu tiên (hoặc user cụ thể)
        const user = await User.findOne().sort({ createdAt: -1 });
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        console.log(`📝 Adding test savings data for user: ${user.email}`);

        // Tạo dữ liệu tiết kiệm test
        const savingsData = [
            {
                userId: user._id,
                amount: 5000000,
                description: 'Tiết kiệm tháng 4',
                category: 'Tiền tiết kiệm',
                date: new Date('2025-04-15')
            },
            {
                userId: user._id,
                amount: 3000000,
                description: 'Tiết kiệm từ lương',
                category: 'Tiền tiết kiệm',
                date: new Date('2025-04-20')
            },
            {
                userId: user._id,
                amount: 2000000,
                description: 'Tiết kiệm cuối tháng',
                category: 'Tiền tiết kiệm',
                date: new Date('2025-04-30')
            },
            {
                userId: user._id,
                amount: 1500000,
                description: 'Tiết kiệm từ thưởng',
                category: 'Tiền tiết kiệm',
                date: new Date('2025-05-05')
            }
        ];

        // Thêm vào database
        const createdSavings = await Income.insertMany(savingsData);
        console.log(`✅ Created ${createdSavings.length} savings records`);

        // Hiển thị dữ liệu đã tạo
        createdSavings.forEach((saving, index) => {
            console.log(`${index + 1}. ${saving.description}: ${saving.amount.toLocaleString('vi-VN')} VND (${saving.date.toLocaleDateString('vi-VN')})`);
        });

        // Kiểm tra tổng tiết kiệm
        const totalSavings = await Income.aggregate([
            {
                $match: {
                    userId: user._id,
                    category: 'Tiền tiết kiệm'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        if (totalSavings.length > 0) {
            console.log(`\n💰 Tổng tiết kiệm: ${totalSavings[0].total.toLocaleString('vi-VN')} VND (${totalSavings[0].count} khoản)`);
        }

        console.log('\n🎉 Test data added successfully!');

    } catch (error) {
        console.error('❌ Error adding test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
};

// Chạy script
addTestSavingsData();
