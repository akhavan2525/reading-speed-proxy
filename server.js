const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// تنظیمات CORS برای دسترسی از HTML
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// مسیر پروکسی
app.post('/proxy', async (req, res) => {
    const apiKey = process.env.HF_TOKEN; // استفاده از متغیر محیطی
    const url = 'https://api-inference.huggingface.co/models/facebook/bart-large';

    try {
        const response = await axios.post(url, req.body, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

app.listen(port, () => {
    console.log(`پروکسی در حال اجرا روی http://localhost:${port}`);
});
