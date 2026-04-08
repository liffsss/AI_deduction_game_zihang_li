const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// 数据库连接
const { connectDB, closeDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '..')));

// API路由
const gameRoutes = require('./routes/game');
const apiRoutes = require('./routes/api');
const authorStyleRoutes = require('./routes/author-style');

app.use('/api/game', gameRoutes);
app.use('/api', apiRoutes);
app.use('/api/author-style', authorStyleRoutes);

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: err.message
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在'
    });
});

// 启动服务器
const startServer = async () => {
    try {
        // 连接数据库
        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 AI推理游戏服务器启动成功！`);
            console.log(`📱 访问地址: http://localhost:${PORT}`);
            console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error.message);
        process.exit(1);
    }
};

startServer();

// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('🛑 收到SIGTERM信号，正在关闭服务器...');
    await closeDB();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 收到SIGINT信号，正在关闭服务器...');
    await closeDB();
    process.exit(0);
});

module.exports = app;
