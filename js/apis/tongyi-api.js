/**
 * 通义万相API集成模块
 * 负责与通义万相API的所有交互，包括场景图片生成、人物肖像生成等
 */

class TongYiAPI {
    constructor() {
        // 使用默认配置以防CONFIG未加载
        const defaultConfig = {
            baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
            model: 'wanx-v1',
            imageSize: '1024*1024',
            style: '<photography>'
        };

        this.baseURL = (window.CONFIG?.APIs?.TONGYI?.baseURL) || defaultConfig.baseURL;
        this.model = (window.CONFIG?.APIs?.TONGYI?.model) || defaultConfig.model;
        this.imageSize = (window.CONFIG?.APIs?.TONGYI?.imageSize) || defaultConfig.imageSize;
        this.style = (window.CONFIG?.APIs?.TONGYI?.style) || defaultConfig.style;
        this.apiKey = null;
        this.keyLoaded = false;

        // 图片缓存
        this.imageCache = new Map();

        // 异步加载API密钥
        this.loadApiKey().then(() => {
            this.keyLoaded = true;
        });
    }

    /**
     * 设置API密钥
     * @param {string} apiKey - 通义万相API密钥
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        // 保存到本地存储
        const storageKey = (window.CONFIG?.STORAGE_KEYS?.apiKeys) || 'ai_reasoning_game_api_keys';
        const utils = window.Utils || { storage: { set: () => {}, get: () => ({}) } };

        utils.storage.set(storageKey, {
            ...utils.storage.get(storageKey, {}),
            tongyi: apiKey
        });
    }

    /**
     * 加载保存的API密钥
     */
    async loadApiKey() {
        // 首先尝试从后端获取配置的密钥
        try {
            const response = await fetch('/api/config/keys');
            const result = await response.json();

            if (result.success && result.config.tongyi) {
                this.apiKey = result.config.tongyi;
                console.log('✅ 通义万相API密钥已从环境变量加载');
                return;
            }
        } catch (error) {
            console.warn('从后端获取API密钥失败，尝试本地存储:', error);
        }

        // 如果后端没有配置，则从本地存储获取
        const storageKey = (window.CONFIG?.STORAGE_KEYS?.apiKeys) || 'ai_reasoning_game_api_keys';
        const utils = window.Utils || { storage: { get: () => ({}) } };
        const keys = utils.storage.get(storageKey, {});
        this.apiKey = keys.tongyi || null;

        if (this.apiKey) {
            console.log('✅ 通义万相API密钥已从本地存储加载');
        } else {
            console.warn('⚠️ 未找到通义万相API密钥');
        }
    }

    /**
     * 验证API密钥是否有效
     * @returns {Promise<boolean>}
     */
    async validateApiKey() {
        if (!this.apiKey) return false;

        try {
            const response = await this.callAPI('test image', '测试图片');
            return response.success;
        } catch (error) {
            console.warn('通义万相API密钥验证失败:', error.message);
            return false;
        }
    }

    /**
     * 调用通义万相API的核心方法 - 异步模式
     * @param {string} prompt - 图片描述提示词
     * @param {string} negativePrompt - 负面提示词
     * @param {Object} options - 可选参数
     * @returns {Promise<Object>}
     */
    async callAPI(prompt, negativePrompt = '', options = {}) {
        if (!this.apiKey) {
            const errorMessage = (window.CONFIG?.ERROR_MESSAGES?.API_KEY_MISSING) || 'API密钥未配置';
            throw new Error(errorMessage);
        }

        // 检查缓存
        const cacheKey = `${prompt}_${negativePrompt}_${JSON.stringify(options)}`;
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }

        const requestData = {
            prompt: prompt,
            negativePrompt: negativePrompt || '模糊，低质量，卡通，动漫风格，变形，扭曲',
            style: options.style || this.style
        };

        try {
            // 显示生成进度
            if (options.onProgress) {
                options.onProgress('正在提交图片生成任务...');
            }

            const response = await fetch('/api/tongyi/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (!result.success) {
                const errorMessage = result.error || (window.CONFIG?.ERROR_MESSAGES?.GENERATION_FAILED) || '内容生成失败';
                throw new Error(errorMessage);
            }

            // 异步模式下，后端已经处理了轮询，直接返回结果
            const imageData = {
                success: true,
                imageUrl: result.data.output.results[0].url,
                taskId: result.data.output.task_id,
                usage: result.data.usage
            };

            // 缓存结果
            this.imageCache.set(cacheKey, imageData);

            if (options.onProgress) {
                options.onProgress('图片生成完成！');
            }

            return imageData;
        } catch (error) {
            console.error('通义万相API调用失败:', error);
            const errorMessage = error.message || (window.CONFIG?.ERROR_MESSAGES?.NETWORK_ERROR) || '网络连接失败';
            throw new Error(errorMessage);
        }
    }

    /**
     * 查询任务状态（备用方法）
     * @param {string} taskId - 任务ID
     * @returns {Promise<Object>}
     */
    async queryTaskStatus(taskId) {
        try {
            const response = await fetch(`/api/tongyi/task/${taskId}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '查询任务状态失败');
            }

            return result.data;
        } catch (error) {
            console.error('查询任务状态失败:', error);
            throw error;
        }
    }

    /**
     * 生成案发现场图片
     * @param {Object} caseInfo - 案件信息
     * @param {string} gameStyle - 游戏风格
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Object>}
     */
    async generateCrimeScene(caseInfo, gameStyle = 'noir', onProgress = null) {
        const styleConfig = window.CONFIG?.GAME?.gameStyles?.[gameStyle];
        const styleDescription = styleConfig ? styleConfig.imageStyle : '写实风格';

        const prompt = `推理小说案发现场：${caseInfo.location}，${caseInfo.background}，${styleDescription}，悬疑氛围，电影级画质，专业摄影，高清细节`;

        const negativePrompt = '人物，角色，卡通，动漫，模糊，低质量，变形';

        try {
            if (onProgress) onProgress('正在生成案发现场图片...');

            const result = await this.callAPI(prompt, negativePrompt, {
                style: '<photography>',
                onProgress: onProgress
            });

            return {
                success: true,
                imageUrl: result.imageUrl,
                type: 'crime_scene',
                description: '案发现场',
                prompt: prompt,
                usage: result.usage
            };
        } catch (error) {
            console.error('案发现场图片生成失败:', error);
            throw new Error(`案发现场图片生成失败: ${error.message}`);
        }
    }

    /**
     * 生成人物肖像
     * @param {Object} character - 角色信息
     * @param {string} gameStyle - 游戏风格
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Object>}
     */
    async generateCharacterPortrait(character, gameStyle = 'noir', onProgress = null) {
        const styleConfig = window.CONFIG?.GAME?.gameStyles?.[gameStyle];
        const styleDescription = styleConfig ? styleConfig.imageStyle : '写实风格';

        const prompt = `人物肖像：${character.appearance}，${character.age}岁，${character.personality}的表情，${styleDescription}，推理小说角色，专业肖像摄影，高质量，细节丰富`;

        const negativePrompt = '卡通，动漫，模糊，低质量，变形，多个人物';

        try {
            if (onProgress) onProgress(`正在生成${character.name}的肖像...`);

            const result = await this.callAPI(prompt, negativePrompt, {
                style: '<portrait>',
                onProgress: onProgress
            });

            return {
                success: true,
                imageUrl: result.imageUrl,
                type: 'character_portrait',
                characterId: character.id,
                characterName: character.name,
                description: `${character.name}的肖像`,
                prompt: prompt,
                usage: result.usage
            };
        } catch (error) {
            console.error(`${character.name}肖像生成失败:`, error);
            throw new Error(`${character.name}肖像生成失败: ${error.message}`);
        }
    }

    /**
     * 生成线索物品图片
     * @param {Object} clue - 线索信息
     * @param {string} gameStyle - 游戏风格
     * @returns {Promise<Object>}
     */
    async generateClueImage(clue, gameStyle = 'noir') {
        const styleConfig = window.CONFIG?.GAME?.gameStyles?.[gameStyle];
        const styleDescription = styleConfig ? styleConfig.imageStyle : '写实风格';
        
        const prompt = `证物特写：${clue.description}，推理小说道具，${styleDescription}，清晰细节，专业摄影，证据照片风格`;
        
        const negativePrompt = '人物，角色，卡通，动漫，模糊，低质量';

        try {
            const result = await this.callAPI(prompt, negativePrompt, {
                style: '<photography>'
            });
            
            return {
                success: true,
                imageUrl: result.imageUrl,
                type: 'clue_image',
                clueId: clue.id,
                clueName: clue.name,
                description: `线索：${clue.name}`,
                prompt: prompt,
                usage: result.usage
            };
        } catch (error) {
            console.error(`线索${clue.name}图片生成失败:`, error);
            throw new Error(`线索图片生成失败: ${error.message}`);
        }
    }

    /**
     * 生成场所环境图片
     * @param {string} location - 地点描述
     * @param {string} atmosphere - 氛围描述
     * @param {string} gameStyle - 游戏风格
     * @returns {Promise<Object>}
     */
    async generateLocationImage(location, atmosphere, gameStyle = 'noir') {
        const styleConfig = window.CONFIG?.GAME?.gameStyles?.[gameStyle];
        const styleDescription = styleConfig ? styleConfig.imageStyle : '写实风格';
        
        const prompt = `场景环境：${location}，${atmosphere}，${styleDescription}，推理小说场景，电影级画质，环境摄影`;
        
        const negativePrompt = '人物，角色，卡通，动漫，模糊，低质量';

        try {
            const result = await this.callAPI(prompt, negativePrompt, {
                style: '<photography>'
            });
            
            return {
                success: true,
                imageUrl: result.imageUrl,
                type: 'location_image',
                location: location,
                description: `场景：${location}`,
                prompt: prompt,
                usage: result.usage
            };
        } catch (error) {
            console.error(`场景${location}图片生成失败:`, error);
            throw new Error(`场景图片生成失败: ${error.message}`);
        }
    }

    /**
     * 生成推理过程可视化图片
     * @param {Object} reasoningData - 推理数据
     * @param {string} gameStyle - 游戏风格
     * @returns {Promise<Object>}
     */
    async generateReasoningVisualization(reasoningData, gameStyle = 'noir') {
        const styleConfig = window.CONFIG?.GAME?.gameStyles?.[gameStyle];
        const styleDescription = styleConfig ? styleConfig.imageStyle : '写实风格';
        
        const prompt = `推理过程图：证据整理，线索连接，推理图表，${styleDescription}，侦探工作台，专业分析图，清晰布局`;
        
        const negativePrompt = '人物，角色，卡通，动漫，模糊，低质量';

        try {
            const result = await this.callAPI(prompt, negativePrompt, {
                style: '<design>'
            });
            
            return {
                success: true,
                imageUrl: result.imageUrl,
                type: 'reasoning_visualization',
                description: '推理过程可视化',
                prompt: prompt,
                usage: result.usage
            };
        } catch (error) {
            console.error('推理可视化图片生成失败:', error);
            throw new Error(`推理可视化图片生成失败: ${error.message}`);
        }
    }

    /**
     * 批量生成游戏所需图片
     * @param {Object} gameData - 游戏数据
     * @param {string} gameStyle - 游戏风格
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Object>}
     */
    async generateGameImages(gameData, gameStyle = 'noir', onProgress = null) {
        const { script } = gameData;
        const images = {
            crimeScene: null,
            characters: {},
            clues: {},
            locations: {}
        };

        try {
            let completedTasks = 0;
            const totalTasks = 1 + script.characters.length + script.clues.filter(clue => clue.importance === 'high').length;

            const updateProgress = (message) => {
                if (onProgress) {
                    onProgress(`${message} (${completedTasks}/${totalTasks})`);
                }
            };

            // 生成案发现场
            try {
                updateProgress('正在生成案发现场图片...');
                images.crimeScene = await this.generateCrimeScene(script, gameStyle, updateProgress);
                completedTasks++;
                updateProgress('案发现场图片生成完成');
            } catch (error) {
                console.error('案发现场生成失败:', error);
            }

            // 生成人物肖像（逐个生成以避免并发限制）
            for (const character of script.characters) {
                try {
                    updateProgress(`正在生成${character.name}的肖像...`);
                    images.characters[character.id] = await this.generateCharacterPortrait(character, gameStyle, updateProgress);
                    completedTasks++;
                    updateProgress(`${character.name}肖像生成完成`);
                } catch (error) {
                    console.error(`${character.name}肖像生成失败:`, error);
                    completedTasks++;
                }
            }

            // 生成重要线索图片
            const importantClues = script.clues.filter(clue => clue.importance === 'high');
            for (const clue of importantClues) {
                try {
                    updateProgress(`正在生成线索"${clue.name}"的图片...`);
                    images.clues[clue.id] = await this.generateClueImage(clue, gameStyle, updateProgress);
                    completedTasks++;
                    updateProgress(`线索"${clue.name}"图片生成完成`);
                } catch (error) {
                    console.error(`线索${clue.name}图片生成失败:`, error);
                    completedTasks++;
                }
            }

            if (onProgress) {
                onProgress('所有图片生成完成！');
            }

            return {
                success: true,
                images: images,
                message: '游戏图片生成完成'
            };
        } catch (error) {
            console.error('批量图片生成失败:', error);
            throw new Error(`批量图片生成失败: ${error.message}`);
        }
    }

    /**
     * 代理图片URL（解决跨域问题）
     * @param {string} originalUrl - 原始图片URL
     * @returns {string}
     */
    getProxyImageUrl(originalUrl) {
        if (!originalUrl) return '';
        return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
    }

    /**
     * 清除图片缓存
     */
    clearCache() {
        this.imageCache.clear();
    }

    /**
     * 获取缓存统计信息
     * @returns {Object}
     */
    getCacheStats() {
        return {
            size: this.imageCache.size,
            keys: Array.from(this.imageCache.keys())
        };
    }
}

// 创建全局实例
window.tongYiAPI = new TongYiAPI();
