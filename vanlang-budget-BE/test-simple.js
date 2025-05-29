console.log('Testing Node.js execution...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Test import
try {
    console.log('Testing ES modules...');
    import('express').then(() => {
        console.log('Express import successful');
    }).catch(err => {
        console.error('Express import failed:', err.message);
    });
} catch (error) {
    console.error('Import error:', error.message);
}

console.log('Test completed');
