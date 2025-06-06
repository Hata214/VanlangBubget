// Test import để kiểm tra lỗi
try {
    console.log('Testing imports...');
    
    // Test basic imports
    console.log('1. Testing express...');
    const express = await import('express');
    console.log('✅ Express imported successfully');
    
    console.log('2. Testing nodemailer...');
    const nodemailer = await import('nodemailer');
    console.log('✅ Nodemailer imported successfully');
    
    console.log('3. Testing multer...');
    const multer = await import('multer');
    console.log('✅ Multer imported successfully');
    
    console.log('4. Testing systemSettingsController...');
    const systemController = await import('./src/controllers/systemSettingsController.js');
    console.log('✅ SystemSettingsController imported successfully');
    
    console.log('5. Testing adminTransactionController...');
    const transactionController = await import('./src/controllers/adminTransactionController.js');
    console.log('✅ AdminTransactionController imported successfully');
    
    console.log('6. Testing adminManagementController...');
    const adminController = await import('./src/controllers/adminManagementController.js');
    console.log('✅ AdminManagementController imported successfully');
    
    console.log('7. Testing adminRoutes...');
    const adminRoutes = await import('./src/routes/adminRoutes.js');
    console.log('✅ AdminRoutes imported successfully');
    
    console.log('\n🎉 All imports successful!');
    
} catch (error) {
    console.error('❌ Import error:', error.message);
    console.error('Stack:', error.stack);
}
