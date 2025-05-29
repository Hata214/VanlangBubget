import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Test server is running!' });
});

app.post('/api/agent/ask', (req, res) => {
    console.log('🔍 Test Agent Request:', req.body);
    res.json({ 
        success: true, 
        message: 'Test response from backend',
        receivedMessage: req.body.message 
    });
});

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
