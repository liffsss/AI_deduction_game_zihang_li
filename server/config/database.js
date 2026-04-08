const mongoose = require('mongoose');

// MongoDB连接配置
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-reasoning-game';
        
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`🍃 MongoDB连接成功: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB连接失败:', error.message);
        process.exit(1);
    }
};

// 优雅关闭数据库连接
const closeDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('🍃 MongoDB连接已关闭');
    } catch (error) {
        console.error('❌ 关闭MongoDB连接失败:', error.message);
    }
};

module.exports = {
    connectDB,
    closeDB
};
