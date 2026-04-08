const axios = require('axios');
const AuthorStyle = require('../models/author-style');

class RAGService {
    constructor() {
        // 延迟获取API密钥，确保环境变量已加载
        this.deepseekApiKey = null;
    }

    // 获取API密钥
    getApiKey() {
        if (!this.deepseekApiKey) {
            this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
        }
        return this.deepseekApiKey;
    }

    // 使用DeepSeek API生成文本向量
    async generateEmbedding(text) {
        try {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                console.warn('DeepSeek API密钥未配置，使用随机向量');
                return this.generateRandomVector(100);
            }

            // 使用DeepSeek的chat模型生成特征向量（简化版本）
            const response = await axios.post('https://api.deepseek.com/chat/completions', {
                model: 'deepseek-chat',
                messages: [{
                    role: 'system',
                    content: '请将以下文本转换为数值特征向量，返回100个0-1之间的浮点数，用逗号分隔：'
                }, {
                    role: 'user',
                    content: text
                }],
                temperature: 0.1,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const vectorText = response.data.choices[0].message.content;
            // 解析向量数据
            const vector = this.parseVectorFromText(vectorText);
            return vector;
        } catch (error) {
            console.error('生成向量失败:', error.message);
            // 返回随机向量作为fallback
            return this.generateRandomVector(100);
        }
    }

    // 从文本中解析向量
    parseVectorFromText(text) {
        try {
            // 提取数字
            const numbers = text.match(/\d+\.?\d*/g);
            if (numbers && numbers.length >= 50) {
                return numbers.slice(0, 100).map(n => parseFloat(n) / 100);
            }
        } catch (error) {
            console.error('解析向量失败:', error.message);
        }
        return this.generateRandomVector(100);
    }

    // 生成随机向量（fallback）
    generateRandomVector(dimension) {
        return Array.from({ length: dimension }, () => Math.random());
    }

    // 计算余弦相似度
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // 为作家风格生成向量
    async vectorizeAuthorStyle(authorStyle) {
        const textToVectorize = [
            authorStyle.style.characteristics,
            authorStyle.style.themes.join(' '),
            authorStyle.style.narrativeStyle,
            authorStyle.style.languageFeatures.join(' '),
            authorStyle.plotStructure.openingStyle,
            authorStyle.characterization.dialogueStyle
        ].join(' ');

        return await this.generateEmbedding(textToVectorize);
    }

    // 基于查询检索相似的作家风格
    async searchSimilarStyles(query, limit = 5) {
        try {
            // 生成查询向量
            const queryVector = await this.generateEmbedding(query);
            
            // 获取所有作家风格
            const allStyles = await AuthorStyle.find({});
            
            // 计算相似度并排序
            const similarities = allStyles.map(style => ({
                style,
                similarity: this.cosineSimilarity(queryVector, style.embedding || [])
            }));

            // 按相似度排序并返回前N个
            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .map(item => ({
                    ...item.style.toObject(),
                    similarity: item.similarity
                }));
        } catch (error) {
            console.error('检索相似风格失败:', error.message);
            return [];
        }
    }

    // 基于游戏类型推荐作家风格
    async recommendStylesForGame(gameType, themes = [], limit = 3) {
        try {
            const query = `${gameType} 推理游戏 ${themes.join(' ')} 悬疑 侦探`;
            return await this.searchSimilarStyles(query, limit);
        } catch (error) {
            console.error('推荐作家风格失败:', error.message);
            return [];
        }
    }

    // 生成风格化的剧本提示词
    generateStylePrompt(authorStyle, gameContext) {
        const prompt = `
请以${authorStyle.chineseName}(${authorStyle.name})的写作风格创作推理游戏剧本。

写作风格特征：
- 文学特点：${authorStyle.style.characteristics}
- 叙述风格：${authorStyle.style.narrativeStyle}
- 语言特色：${authorStyle.style.languageFeatures.join('、')}
- 常用主题：${authorStyle.style.themes.join('、')}

情节结构要求：
- 开头方式：${authorStyle.plotStructure.openingStyle}
- 冲突类型：${authorStyle.plotStructure.conflictTypes.join('、')}
- 节奏控制：${authorStyle.plotStructure.pacing}
- 结局风格：${authorStyle.plotStructure.endingStyle}

角色塑造：
- 对话风格：${authorStyle.characterization.dialogueStyle}
- 心理描写：${authorStyle.characterization.psychologicalDepth}

环境描写：
- 描写风格：${authorStyle.settingDescription.descriptiveStyle}
- 氛围营造：${authorStyle.settingDescription.atmosphereCreation}

游戏背景：${gameContext}

请严格按照以上风格特征创作，保持${authorStyle.chineseName}独特的文学风格。
        `.trim();

        return prompt;
    }
}

module.exports = new RAGService();
