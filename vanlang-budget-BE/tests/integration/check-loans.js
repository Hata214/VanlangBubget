const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
    console.log('✅ Connected to MongoDB');
    
    // Check loans for test user
    const Loan = mongoose.model('Loan', new mongoose.Schema({}, { strict: false }));
    const loans = await Loan.find({ userId: '67e92aa381a9977f410a91e0' });
    
    console.log('🏦 LOAN CHECK:');
    console.log('Total loans:', loans.length);
    
    if (loans.length > 0) {
      loans.forEach((loan, i) => {
        console.log(`Loan ${i+1}:`);
        console.log('- ID:', loan._id);
        console.log('- Description:', loan.description);
        console.log('- Amount:', loan.amount);
        console.log('- Status:', loan.status);
        console.log('- Interest Rate:', loan.interestRate);
        console.log('- Interest Rate Type:', loan.interestRateType);
        console.log('- Start Date:', loan.startDate);
        console.log('- Due Date:', loan.dueDate);
        console.log('---');
      });
      
      // Check ACTIVE loans only
      const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');
      console.log('🟢 ACTIVE loans:', activeLoans.length);
      
      if (activeLoans.length > 0) {
        console.log('🟢 ACTIVE LOAN DETAILS:');
        activeLoans.forEach((loan, i) => {
          console.log(`Active Loan ${i+1}:`);
          console.log('- Description:', loan.description);
          console.log('- Amount:', loan.amount);
          console.log('- Interest Rate:', loan.interestRate, '%');
          console.log('- Interest Rate Type:', loan.interestRateType);
        });
      }
      
    } else {
      console.log('❌ NO LOANS FOUND for this user');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkData();
