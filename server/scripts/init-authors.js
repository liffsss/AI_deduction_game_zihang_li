/**
 * 初始化作家风格数据脚本
 * 用于将默认作家数据导入MongoDB数据库
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 导入数据库连接和模型
const { connectDB, closeDB } = require('../config/database');
const AuthorStyle = require('../models/author-style');
const ragService = require('../services/rag-service');

async function initAuthors() {
    try {
        console.log('🚀 开始初始化作家风格数据...');
        
        // 连接数据库
        await connectDB();
        
        // 读取默认作家数据
        const authorsPath = path.join(__dirname, '..', '..', 'data', 'author-styles.json');
        const authorsData = JSON.parse(fs.readFileSync(authorsPath, 'utf8'));
        
        console.log(`📚 找到 ${authorsData.length} 个作家数据`);
        
        // 清空现有数据（可选）
        const existingCount = await AuthorStyle.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️ 数据库中已存在 ${existingCount} 个作家数据`);
            console.log('跳过已存在的作家，只添加新的作家...');
        }
        
        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // 逐个处理作家数据
        for (const authorData of authorsData) {
            try {
                // 检查是否已存在
                const existing = await AuthorStyle.findOne({ name: authorData.name });
                if (existing) {
                    console.log(`⏭️ 跳过已存在的作家: ${authorData.chineseName}`);
                    skippedCount++;
                    continue;
                }
                
                // 生成向量
                console.log(`🔄 正在处理: ${authorData.chineseName}...`);
                try {
                    const embedding = await ragService.vectorizeAuthorStyle(authorData);
                    authorData.embedding = embedding;
                    console.log(`✅ 向量生成成功: ${authorData.chineseName}`);
                } catch (embeddingError) {
                    console.warn(`⚠️ 向量生成失败，使用随机向量: ${authorData.chineseName}`);
                    authorData.embedding = ragService.generateRandomVector(100);
                }
                
                // 创建并保存
                const author = new AuthorStyle(authorData);
                await author.save();
                
                console.log(`✅ 成功添加: ${authorData.chineseName}`);
                addedCount++;

                // 添加延迟避免API限制（仅在使用真实API时）
                if (process.env.DEEPSEEK_API_KEY) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`❌ 处理作家 ${authorData.chineseName} 失败:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n📊 初始化完成统计:');
        console.log(`✅ 成功添加: ${addedCount} 个作家`);
        console.log(`⏭️ 跳过已存在: ${skippedCount} 个作家`);
        console.log(`❌ 处理失败: ${errorCount} 个作家`);
        
        // 验证数据
        const totalCount = await AuthorStyle.countDocuments();
        console.log(`📚 数据库中总共有 ${totalCount} 个作家风格`);
        
        // 测试检索功能
        console.log('\n🔍 测试检索功能...');
        try {
            const testResults = await ragService.searchSimilarStyles('推理小说 侦探', 3);
            console.log(`找到 ${testResults.length} 个相似风格:`);
            testResults.forEach((result, index) => {
                console.log(`${index + 1}. ${result.chineseName} (相似度: ${(result.similarity * 100).toFixed(1)}%)`);
            });
        } catch (testError) {
            console.warn('⚠️ 检索功能测试失败:', testError.message);
            console.log('💡 这可能是因为API密钥未配置，但不影响基本功能');
        }
        
        console.log('\n🎉 作家风格数据初始化完成！');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        process.exit(1);
    } finally {
        // 关闭数据库连接
        await closeDB();
        process.exit(0);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initAuthors();
}

module.exports = initAuthors;
