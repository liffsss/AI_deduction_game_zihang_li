const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 游戏数据存储目录
const GAMES_DIR = path.join(__dirname, '..', '..', 'data', 'games');

// 确保游戏数据目录存在
async function ensureGamesDir() {
    try {
        await fs.access(GAMES_DIR);
    } catch (error) {
        await fs.mkdir(GAMES_DIR, { recursive: true });
    }
}

// 生成游戏ID
function generateGameId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 保存游戏数据
router.post('/save', async (req, res) => {
    try {
        await ensureGamesDir();
        
        const gameData = req.body;
        const gameId = gameData.id || generateGameId();
        
        // 添加时间戳
        gameData.id = gameId;
        gameData.createdAt = gameData.createdAt || new Date().toISOString();
        gameData.updatedAt = new Date().toISOString();
        
        const filePath = path.join(GAMES_DIR, `${gameId}.json`);
        await fs.writeFile(filePath, JSON.stringify(gameData, null, 2));
        
        res.json({
            success: true,
            gameId: gameId,
            message: '游戏保存成功'
        });
    } catch (error) {
        console.error('保存游戏失败:', error);
        res.status(500).json({
            success: false,
            error: '保存游戏失败',
            message: error.message
        });
    }
});

// 加载游戏数据
router.get('/load/:gameId', async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const filePath = path.join(GAMES_DIR, `${gameId}.json`);
        
        const gameData = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(gameData);
        
        res.json({
            success: true,
            gameData: parsedData
        });
    } catch (error) {
        console.error('加载游戏失败:', error);
        res.status(404).json({
            success: false,
            error: '游戏不存在或加载失败',
            message: error.message
        });
    }
});

// 获取游戏列表
router.get('/list', async (req, res) => {
    try {
        await ensureGamesDir();
        
        const files = await fs.readdir(GAMES_DIR);
        const gameFiles = files.filter(file => file.endsWith('.json'));
        
        const games = [];
        for (const file of gameFiles) {
            try {
                const filePath = path.join(GAMES_DIR, file);
                const gameData = await fs.readFile(filePath, 'utf8');
                const parsedData = JSON.parse(gameData);
                
                games.push({
                    id: parsedData.id,
                    title: parsedData.script?.title || '未命名游戏',
                    createdAt: parsedData.createdAt,
                    updatedAt: parsedData.updatedAt,
                    status: parsedData.gameProgress?.currentPhase || 'created'
                });
            } catch (error) {
                console.error(`读取游戏文件 ${file} 失败:`, error);
            }
        }
        
        // 按更新时间排序
        games.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        res.json({
            success: true,
            games: games
        });
    } catch (error) {
        console.error('获取游戏列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取游戏列表失败',
            message: error.message
        });
    }
});

// 删除游戏
router.delete('/delete/:gameId', async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const filePath = path.join(GAMES_DIR, `${gameId}.json`);
        
        await fs.unlink(filePath);
        
        res.json({
            success: true,
            message: '游戏删除成功'
        });
    } catch (error) {
        console.error('删除游戏失败:', error);
        res.status(500).json({
            success: false,
            error: '删除游戏失败',
            message: error.message
        });
    }
});

// 更新游戏进度
router.patch('/progress/:gameId', async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const progressUpdate = req.body;

        const filePath = path.join(GAMES_DIR, `${gameId}.json`);
        const gameData = await fs.readFile(filePath, 'utf8');

        let parsedData;
        try {
            parsedData = JSON.parse(gameData);
        } catch (jsonError) {
            console.error('JSON解析失败，尝试修复:', jsonError);
            console.error('文件内容长度:', gameData.length);
            console.error('错误位置附近的内容:', gameData.substring(15650, 15680));

            // 尝试修复JSON - 移除可能的尾部垃圾字符
            const cleanedData = gameData.trim();
            try {
                parsedData = JSON.parse(cleanedData);
                console.log('JSON修复成功');
            } catch (secondError) {
                console.error('JSON修复失败:', secondError);
                throw new Error('游戏文件损坏，无法解析JSON');
            }
        }
        
        // 更新游戏进度
        if (!parsedData.gameProgress) {
            parsedData.gameProgress = {};
        }
        
        Object.assign(parsedData.gameProgress, progressUpdate);
        parsedData.updatedAt = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(parsedData, null, 2));
        
        res.json({
            success: true,
            message: '游戏进度更新成功',
            gameProgress: parsedData.gameProgress
        });
    } catch (error) {
        console.error('更新游戏进度失败:', error);
        res.status(500).json({
            success: false,
            error: '更新游戏进度失败',
            message: error.message
        });
    }
});

// 添加对话记录
router.post('/conversation/:gameId', async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const conversationData = req.body;
        
        const filePath = path.join(GAMES_DIR, `${gameId}.json`);
        const gameData = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(gameData);
        
        // 初始化对话历史
        if (!parsedData.gameProgress) {
            parsedData.gameProgress = {};
        }
        if (!parsedData.gameProgress.conversationHistory) {
            parsedData.gameProgress.conversationHistory = [];
        }
        
        // 添加新对话
        conversationData.timestamp = new Date().toISOString();
        parsedData.gameProgress.conversationHistory.push(conversationData);
        parsedData.updatedAt = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(parsedData, null, 2));
        
        res.json({
            success: true,
            message: '对话记录保存成功'
        });
    } catch (error) {
        console.error('保存对话记录失败:', error);
        res.status(500).json({
            success: false,
            error: '保存对话记录失败',
            message: error.message
        });
    }
});

// 发现新线索
router.post('/clue/:gameId', async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const clueData = req.body;
        
        const filePath = path.join(GAMES_DIR, `${gameId}.json`);
        const gameData = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(gameData);
        
        // 初始化已发现线索
        if (!parsedData.gameProgress) {
            parsedData.gameProgress = {};
        }
        if (!parsedData.gameProgress.discoveredClues) {
            parsedData.gameProgress.discoveredClues = [];
        }
        
        // 检查线索是否已发现
        const existingClue = parsedData.gameProgress.discoveredClues.find(
            clue => clue.id === clueData.id
        );
        
        if (!existingClue) {
            clueData.discoveredAt = new Date().toISOString();
            parsedData.gameProgress.discoveredClues.push(clueData);
            parsedData.updatedAt = new Date().toISOString();
            
            await fs.writeFile(filePath, JSON.stringify(parsedData, null, 2));
            
            res.json({
                success: true,
                message: '新线索发现！',
                clue: clueData
            });
        } else {
            res.json({
                success: true,
                message: '线索已存在',
                clue: existingClue
            });
        }
    } catch (error) {
        console.error('保存线索失败:', error);
        res.status(500).json({
            success: false,
            error: '保存线索失败',
            message: error.message
        });
    }
});

// 提交推理结果
router.post('/reasoning/:gameId', async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const reasoningData = req.body;
        
        const filePath = path.join(GAMES_DIR, `${gameId}.json`);
        const gameData = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(gameData);
        
        // 保存推理结果
        if (!parsedData.gameProgress) {
            parsedData.gameProgress = {};
        }
        
        parsedData.gameProgress.reasoning = {
            ...reasoningData,
            submittedAt: new Date().toISOString()
        };
        parsedData.gameProgress.currentPhase = 'completed';
        parsedData.updatedAt = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(parsedData, null, 2));
        
        res.json({
            success: true,
            message: '推理结果提交成功',
            reasoning: parsedData.gameProgress.reasoning
        });
    } catch (error) {
        console.error('保存推理结果失败:', error);
        res.status(500).json({
            success: false,
            error: '保存推理结果失败',
            message: error.message
        });
    }
});

module.exports = router;
