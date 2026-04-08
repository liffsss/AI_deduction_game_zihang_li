/**
 * 配置测试脚本
 * 用于验证环境变量和API密钥配置是否正确
 */

require('dotenv').config();

async function testConfiguration() {
    console.log('🔧 开始测试配置...\n');
    
    // 测试环境变量
    console.log('📋 环境变量检查:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
    console.log(`PORT: ${process.env.PORT || '未设置'}`);
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '已设置' : '未设置'}`);
    console.log(`DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置'}`);
    console.log(`TONGYI_API_KEY: ${process.env.TONGYI_API_KEY ? '已设置' : '未设置'}\n`);
    
    // 测试MongoDB连接
    console.log('🍃 测试MongoDB连接...');
    try {
        const { connectDB, closeDB } = require('../config/database');
        await connectDB();
        console.log('✅ MongoDB连接成功\n');
        await closeDB();
    } catch (error) {
        console.error('❌ MongoDB连接失败:', error.message);
        console.log('💡 请确保MongoDB服务正在运行\n');
    }
    
    // 测试DeepSeek API
    if (process.env.DEEPSEEK_API_KEY) {
        console.log('🤖 测试DeepSeek API...');
        try {
            const axios = require('axios');
            const response = await axios.post('https://api.deepseek.com/chat/completions', {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            console.log('✅ DeepSeek API连接成功\n');
        } catch (error) {
            console.error('❌ DeepSeek API连接失败:', error.response?.data || error.message);
            console.log('💡 请检查API密钥是否正确\n');
        }
    } else {
        console.log('⚠️ DeepSeek API密钥未配置，跳过测试\n');
    }
    
    // 测试通义万相API
    if (process.env.TONGYI_API_KEY) {
        console.log('🎨 测试通义万相API...');
        try {
            const axios = require('axios');
            const response = await axios.post(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
                {
                    model: 'wanx-v1',
                    input: { prompt: 'test' },
                    parameters: { size: '512*512', n: 1 }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.TONGYI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            console.log('✅ 通义万相API连接成功\n');
        } catch (error) {
            console.error('❌ 通义万相API连接失败:', error.response?.data || error.message);
            console.log('💡 请检查API密钥是否正确\n');
        }
    } else {
        console.log('⚠️ 通义万相API密钥未配置，跳过测试\n');
    }
    
    // 配置建议
    console.log('💡 配置建议:');
    if (!process.env.DEEPSEEK_API_KEY) {
        console.log('- 配置DEEPSEEK_API_KEY以启用AI剧本生成和作家风格向量化');
    }
    if (!process.env.TONGYI_API_KEY) {
        console.log('- 配置TONGYI_API_KEY以启用图片生成功能');
    }
    if (!process.env.MONGODB_URI) {
        console.log('- 配置MONGODB_URI以启用作家风格数据库功能');
    }
    
    console.log('\n🎉 配置测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
    testConfiguration().catch(console.error);
}

module.exports = testConfiguration;
