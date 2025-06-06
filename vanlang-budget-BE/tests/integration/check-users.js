// Script để kiểm tra users và dữ liệu tài chính
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

// Import models
const userSchema = new mongoose.Schema({}, { strict: false });
const incomeSchema = new mongoose.Schema({}, { strict: false });
const expenseSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Income = mongoose.model('Income', incomeSchema);
const Expense = mongoose.model('Expense', expenseSchema);

async function checkUsers() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. List all users
        console.log('\n📋 All users:');
        const users = await User.find({}, { email: 1, firstName: 1, lastName: 1, role: 1 });
        users.forEach(user => {
            console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role} - ID: ${user._id}`);
        });

        // 2. Check financial data for each user
        console.log('\n💰 Financial data by user:');
        for (const user of users) {
            const incomes = await Income.find({ userId: user._id });
            const expenses = await Expense.find({ userId: user._id });

            const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
            const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

            console.log(`\n👤 ${user.email}:`);
            console.log(`  - Incomes: ${incomes.length} records, Total: ${totalIncome.toLocaleString('vi-VN')} VND`);
            console.log(`  - Expenses: ${expenses.length} records, Total: ${totalExpense.toLocaleString('vi-VN')} VND`);
            console.log(`  - Net: ${(totalIncome - totalExpense).toLocaleString('vi-VN')} VND`);

            if (incomes.length > 0) {
                console.log(`  - Sample income:`, incomes[0]);
            }
            if (expenses.length > 0) {
                console.log(`  - Sample expense:`, expenses[0]);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

checkUsers();
