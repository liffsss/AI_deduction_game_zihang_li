const express = require('express');
const router = express.Router();
const AuthorStyle = require('../models/author-style');
const ragService = require('../services/rag-service');

// 获取所有作家风格
router.get('/list', async (req, res) => {
    try {
        const { page = 1, limit = 10, genre, era, search } = req.query;
        
        let query = {};
        
        // 按文学流派筛选
        if (genre) {
            query['style.genre'] = { $in: [genre] };
        }
        
        // 按时代筛选
        if (era) {
            query.era = era;
        }
        
        // 文本搜索
        if (search) {
            query.$text = { $search: search };
        }
        
        const skip = (page - 1) * limit;
        const authors = await AuthorStyle.find(query)
            .sort({ 'metadata.popularity': -1, 'metadata.createdAt': -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await AuthorStyle.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                authors,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / limit),
                    count: authors.length,
                    totalCount: total
                }
            }
        });
    } catch (error) {
        console.error('获取作家风格列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取作家风格列表失败',
            message: error.message
        });
    }
});

// 获取单个作家风格详情
router.get('/:id', async (req, res) => {
    try {
        const author = await AuthorStyle.findById(req.params.id);
        
        if (!author) {
            return res.status(404).json({
                success: false,
                error: '作家风格不存在'
            });
        }
        
        res.json({
            success: true,
            data: author
        });
    } catch (error) {
        console.error('获取作家风格详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取作家风格详情失败',
            message: error.message
        });
    }
});

// 搜索相似的作家风格
router.post('/search', async (req, res) => {
    try {
        const { query, limit = 5 } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: '搜索查询不能为空'
            });
        }
        
        const similarStyles = await ragService.searchSimilarStyles(query, limit);
        
        res.json({
            success: true,
            data: similarStyles
        });
    } catch (error) {
        console.error('搜索相似风格失败:', error);
        res.status(500).json({
            success: false,
            error: '搜索相似风格失败',
            message: error.message
        });
    }
});

// 为游戏推荐作家风格
router.post('/recommend', async (req, res) => {
    try {
        const { gameType, themes = [], limit = 3 } = req.body;
        
        if (!gameType) {
            return res.status(400).json({
                success: false,
                error: '游戏类型不能为空'
            });
        }
        
        const recommendations = await ragService.recommendStylesForGame(gameType, themes, limit);
        
        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('推荐作家风格失败:', error);
        res.status(500).json({
            success: false,
            error: '推荐作家风格失败',
            message: error.message
        });
    }
});

// 生成风格化提示词
router.post('/generate-prompt', async (req, res) => {
    try {
        const { authorId, gameContext } = req.body;
        
        if (!authorId || !gameContext) {
            return res.status(400).json({
                success: false,
                error: '作家ID和游戏背景不能为空'
            });
        }
        
        const author = await AuthorStyle.findById(authorId);
        if (!author) {
            return res.status(404).json({
                success: false,
                error: '作家风格不存在'
            });
        }
        
        const stylePrompt = ragService.generateStylePrompt(author, gameContext);
        
        res.json({
            success: true,
            data: {
                prompt: stylePrompt,
                author: {
                    name: author.name,
                    chineseName: author.chineseName,
                    style: author.style.characteristics
                }
            }
        });
    } catch (error) {
        console.error('生成风格化提示词失败:', error);
        res.status(500).json({
            success: false,
            error: '生成风格化提示词失败',
            message: error.message
        });
    }
});

// 添加新的作家风格
router.post('/create', async (req, res) => {
    try {
        const authorData = req.body;
        
        // 生成向量
        const embedding = await ragService.vectorizeAuthorStyle(authorData);
        authorData.embedding = embedding;
        
        const author = new AuthorStyle(authorData);
        await author.save();
        
        res.json({
            success: true,
            data: author,
            message: '作家风格创建成功'
        });
    } catch (error) {
        console.error('创建作家风格失败:', error);
        res.status(500).json({
            success: false,
            error: '创建作家风格失败',
            message: error.message
        });
    }
});

// 更新作家风格
router.put('/:id', async (req, res) => {
    try {
        const authorData = req.body;
        
        // 重新生成向量
        const embedding = await ragService.vectorizeAuthorStyle(authorData);
        authorData.embedding = embedding;
        
        const author = await AuthorStyle.findByIdAndUpdate(
            req.params.id,
            authorData,
            { new: true, runValidators: true }
        );
        
        if (!author) {
            return res.status(404).json({
                success: false,
                error: '作家风格不存在'
            });
        }
        
        res.json({
            success: true,
            data: author,
            message: '作家风格更新成功'
        });
    } catch (error) {
        console.error('更新作家风格失败:', error);
        res.status(500).json({
            success: false,
            error: '更新作家风格失败',
            message: error.message
        });
    }
});

// 删除作家风格
router.delete('/:id', async (req, res) => {
    try {
        const author = await AuthorStyle.findByIdAndDelete(req.params.id);
        
        if (!author) {
            return res.status(404).json({
                success: false,
                error: '作家风格不存在'
            });
        }
        
        res.json({
            success: true,
            message: '作家风格删除成功'
        });
    } catch (error) {
        console.error('删除作家风格失败:', error);
        res.status(500).json({
            success: false,
            error: '删除作家风格失败',
            message: error.message
        });
    }
});

// 批量初始化作家风格数据
router.post('/batch-init', async (req, res) => {
    try {
        const { authors } = req.body;
        
        if (!Array.isArray(authors)) {
            return res.status(400).json({
                success: false,
                error: '作家数据必须是数组格式'
            });
        }
        
        const results = [];
        
        for (const authorData of authors) {
            try {
                // 检查是否已存在
                const existing = await AuthorStyle.findOne({ name: authorData.name });
                if (existing) {
                    results.push({ name: authorData.name, status: 'skipped', reason: '已存在' });
                    continue;
                }
                
                // 生成向量
                const embedding = await ragService.vectorizeAuthorStyle(authorData);
                authorData.embedding = embedding;
                
                const author = new AuthorStyle(authorData);
                await author.save();
                
                results.push({ name: authorData.name, status: 'created', id: author._id });
            } catch (error) {
                results.push({ name: authorData.name, status: 'error', error: error.message });
            }
        }
        
        res.json({
            success: true,
            data: results,
            message: '批量初始化完成'
        });
    } catch (error) {
        console.error('批量初始化失败:', error);
        res.status(500).json({
            success: false,
            error: '批量初始化失败',
            message: error.message
        });
    }
});

module.exports = router;
