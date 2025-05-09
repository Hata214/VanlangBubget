import express from 'express';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Body parser middleware
app.use(express.json());

// Test với một route đơn giản
app.get('/', (req, res) => {
    res.json({ message: 'Simple test server is running!' });
});

// Test route thủ công để xem các route nào có vấn đề
app.get('/test/:id', (req, res) => {
    res.json({ id: req.params.id });
});

// Test thử từng route một trong auth
try {
    app.use('/api/auth', authRoutes);
    console.log('Auth routes registered successfully');
} catch (error) {
    console.error('Error with auth routes:', error);
}

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Simple test server running on port ${PORT}`);
}); 