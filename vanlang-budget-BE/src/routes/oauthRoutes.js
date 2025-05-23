import express from 'express';

const router = express.Router();

// OAuth routes placeholder
router.get('/google', (req, res) => {
    res.json({
        message: 'Google OAuth endpoint - chưa được triển khai',
        status: 'pending'
    });
});

router.get('/facebook', (req, res) => {
    res.json({
        message: 'Facebook OAuth endpoint - chưa được triển khai',
        status: 'pending'
    });
});

router.get('/callback/google', (req, res) => {
    res.json({
        message: 'Google OAuth callback - chưa được triển khai',
        status: 'pending'
    });
});

router.get('/callback/facebook', (req, res) => {
    res.json({
        message: 'Facebook OAuth callback - chưa được triển khai',
        status: 'pending'
    });
});

export default router; 