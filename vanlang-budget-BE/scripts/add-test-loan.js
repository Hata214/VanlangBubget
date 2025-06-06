const mongoose = require('mongoose');
require('dotenv').config();

async function addTestLoan() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
    console.log('✅ Connected to MongoDB');
    
    // Define loan schema
    const loanSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      amount: { type: Number, required: true },
      description: { type: String, required: true },
      lender: { type: String, required: true },
      interestRate: { type: Number, default: 0 },
      interestRateType: { type: String, enum: ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'], default: 'YEAR' },
      startDate: { type: Date, required: true },
      dueDate: { type: Date, required: true },
      status: { type: String, enum: ['ACTIVE', 'PAID', 'OVERDUE'], default: 'ACTIVE' }
    }, { timestamps: true });
    
    const Loan = mongoose.model('Loan', loanSchema);
    
    // Add test loan
    const testLoan = new Loan({
      userId: '67e92aa381a9977f410a91e0', // Test user ID
      amount: 50000000, // 50 triệu VND
      description: 'Vay mua nhà',
      lender: 'Ngân hàng ABC',
      interestRate: 8.5, // 8.5% per year
      interestRateType: 'YEAR',
      startDate: new Date('2024-01-01'),
      dueDate: new Date('2025-01-01'),
      status: 'ACTIVE'
    });
    
    const savedLoan = await testLoan.save();
    console.log('✅ Test loan added:', savedLoan._id);
    console.log('- Amount:', savedLoan.amount);
    console.log('- Description:', savedLoan.description);
    console.log('- Interest Rate:', savedLoan.interestRate, '%');
    console.log('- Status:', savedLoan.status);
    
    // Check total loans for user
    const allLoans = await Loan.find({ userId: '67e92aa381a9977f410a91e0' });
    console.log('🏦 Total loans for user:', allLoans.length);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

addTestLoan();
