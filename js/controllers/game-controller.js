/**
 * 游戏控制器
 * 负责游戏的整体流程控制和状态管理
 */

class GameController {
    constructor() {
        this.currentGame = null;
        this.gameState = 'idle'; // idle, generating, playing, completed
        this.gameId = null;
        
        // 事件监听器
        this.eventListeners = new Map();
        
        // 初始化
        this.init();
    }

    /**
     * 初始化游戏控制器
     */
    init() {
        console.log('🎮 游戏控制器初始化');
        
        // 尝试加载上次的游戏
        this.loadLastGame();
        
        // 设置自动保存
        this.setupAutoSave();
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 开始新游戏
     * @param {Object} gameConfig - 游戏配置
     * @param {Object} authorStyle - 作家风格（可选）
     * @returns {Promise<Object>}
     */
    async startNewGame(gameConfig, authorStyle = null) {
        try {
            this.gameState = 'generating';
            this.emit('gameStateChanged', { state: 'generating', message: '正在生成游戏...' });

            console.log('🚀 开始生成新游戏:', gameConfig);
            if (authorStyle) {
                console.log('📚 使用作家风格:', authorStyle.chineseName);
            }

            // 等待API密钥加载完成
            await this.waitForAPIKeys();

            // 显示进度条并开始生成剧本
            this.emit('gameStateChanged', {
                state: 'generating',
                message: authorStyle ? `正在以${authorStyle.chineseName}的风格生成剧本...` : '正在生成剧本...',
                showProgress: true,
                progress: { percentage: 10, step: 'script', status: 'active' }
            });
            const scriptResult = await deepseekAPI.generateScript(gameConfig, authorStyle);
            
            if (!scriptResult.success) {
                throw new Error('剧本生成失败');
            }

            // 提取推理链条
            this.emit('gameStateChanged', { state: 'generating', message: '正在分析推理链条...' });
            const reasoningResult = await deepseekAPI.extractReasoningChain(scriptResult.script);

            // 剧本生成完成，开始生成图片
            this.emit('gameStateChanged', {
                state: 'generating',
                message: '剧本生成完成，开始生成图片...',
                progress: { percentage: 40, step: 'script', status: 'completed', nextStep: 'images' }
            });

            const imagesResult = await tongYiAPI.generateGameImages({
                script: scriptResult.script
            }, gameConfig.gameStyle, (progressMessage) => {
                // 实时更新图片生成进度
                this.emit('gameStateChanged', {
                    state: 'generating',
                    message: `正在生成游戏图片... ${progressMessage}`,
                    progress: { percentage: 60, step: 'images', status: 'active' }
                });
            });

            // 创建游戏数据
            this.currentGame = {
                id: (window.Utils?.generateId) ? window.Utils.generateId() : Date.now().toString(36) + Math.random().toString(36).substr(2),
                config: gameConfig,
                script: scriptResult.script,
                reasoningChain: reasoningResult.reasoningChain,
                images: imagesResult.images,
                gameProgress: {
                    currentPhase: 'investigation',
                    discoveredClues: [],
                    conversationHistory: [],
                    suspicionLevels: this.initializeSuspicionLevels(scriptResult.script.characters),
                    availableCharacters: this.initializeAvailableCharacters(scriptResult.script.characters),
                    discoveredCharacters: [],
                    startTime: new Date().toISOString()
                },
                createdAt: new Date().toISOString()
            };

            this.gameId = this.currentGame.id;
            this.gameState = 'playing';

            // 初始化游戏完成
            this.emit('gameStateChanged', {
                state: 'generating',
                message: '正在初始化游戏...',
                progress: { percentage: 90, step: 'setup', status: 'active' }
            });

            // 保存游戏
            await this.saveGame();

            // 游戏生成完成
            this.emit('gameStateChanged', {
                state: 'playing',
                message: '游戏生成完成！',
                progress: { percentage: 100, step: 'setup', status: 'completed', hideProgress: true }
            });
            this.emit('gameGenerated', this.currentGame);

            console.log('✅ 游戏生成成功:', this.currentGame.id);
            return {
                success: true,
                game: this.currentGame
            };

        } catch (error) {
            console.error('❌ 游戏生成失败:', error);
            this.gameState = 'idle';
            this.emit('gameStateChanged', { state: 'error', message: error.message });
            throw error;
        }
    }

    /**
     * 与角色对话
     * @param {string} characterId - 角色ID
     * @param {string} question - 问题
     * @returns {Promise<Object>}
     */
    async talkToCharacter(characterId, question) {
        if (!this.currentGame || this.gameState !== 'playing') {
            throw new Error('游戏未开始或状态异常');
        }

        try {
            const character = this.currentGame.script.characters.find(c => c.id === characterId);
            if (!character) {
                throw new Error('角色不存在');
            }

            console.log(`💬 与${character.name}对话:`, question);

            // 调用DeepSeek进行角色扮演
            const response = await deepseekAPI.rolePlayCharacter(
                character,
                question,
                {
                    conversationHistory: this.currentGame.gameProgress.conversationHistory,
                    currentPhase: this.currentGame.gameProgress.currentPhase
                }
            );

            // 记录对话
            const conversationRecord = {
                id: (window.Utils?.generateId) ? window.Utils.generateId() : Date.now().toString(36) + Math.random().toString(36).substr(2),
                characterId: characterId,
                character: character.name,
                question: question,
                response: response.response,
                timestamp: new Date().toISOString(),
                newClues: response.newClues || [],
                mentionedCharacters: response.mentionedCharacters || []
            };

            this.currentGame.gameProgress.conversationHistory.push(conversationRecord);

            // 更新怀疑度
            if (response.suspicionChange) {
                this.updateSuspicionLevel(characterId, response.suspicionChange);
            }

            // 处理新线索
            if (response.newClues && response.newClues.length > 0) {
                for (const clue of response.newClues) {
                    await this.discoverClue(clue);
                }
            }

            // 处理提及的新角色
            let discoveredNewCharacters = [];
            console.log('🔧 检查AI回复中的mentionedCharacters:', response.mentionedCharacters);
            if (response.mentionedCharacters && response.mentionedCharacters.length > 0) {
                console.log('🔧 发现AI提及的角色:', response.mentionedCharacters);
                discoveredNewCharacters = await this.processMentionedCharacters(response.mentionedCharacters);
            } else {
                console.log('🔧 AI回复中没有mentionedCharacters字段或为空');
                // 尝试从回复文本中检测角色提及
                const detectedMentions = this.detectCharacterMentions(response.response, question);
                if (detectedMentions.length > 0) {
                    console.log('🔧 从文本中检测到角色提及:', detectedMentions);
                    discoveredNewCharacters = await this.processMentionedCharacters(detectedMentions);
                }
            }

            // 保存游戏进度
            await this.saveGameProgress();

            this.emit('conversationAdded', conversationRecord);

            // 触发角色发现事件
            if (discoveredNewCharacters.length > 0) {
                discoveredNewCharacters.forEach(discovery => {
                    this.emit('characterDiscovered', {
                        character: discovery.character,
                        context: discovery.context,
                        hint: discovery.hint
                    });
                });
            }

            console.log(`✅ 对话完成，${character.name}回应:`, response.response);
            return {
                success: true,
                conversation: conversationRecord,
                newClues: response.newClues || [],
                discoveredCharacters: discoveredNewCharacters
            };

        } catch (error) {
            console.error('❌ 对话失败:', error);
            throw error;
        }
    }

    /**
     * 发现新线索
     * @param {Object} clue - 线索信息
     */
    async discoverClue(clue) {
        if (!this.currentGame) return;

        // 检查是否已发现
        const existing = this.currentGame.gameProgress.discoveredClues.find(c => c.id === clue.id);
        if (existing) return;

        // 添加发现时间
        clue.discoveredAt = new Date().toISOString();
        
        this.currentGame.gameProgress.discoveredClues.push(clue);

        // 尝试生成线索图片
        try {
            if (clue.importance === 'high') {
                const clueImage = await tongYiAPI.generateClueImage(clue, this.currentGame.config.gameStyle);
                clue.imageUrl = clueImage.imageUrl;
            }
        } catch (error) {
            console.warn('线索图片生成失败:', error);
        }

        this.emit('clueDiscovered', clue);
        console.log('🔍 发现新线索:', clue.name);
    }

    /**
     * 处理新发现的线索（公共方法）
     * @param {Object} clue - 新线索对象
     */
    handleNewClue(clue) {
        if (!this.currentGame || !this.currentGame.script) return;

        // 检查线索是否已存在于脚本中
        const existingClue = this.currentGame.script.clues.find(c => c.id === clue.id);
        if (existingClue) {
            // 更新现有线索的发现时间
            existingClue.discoveredAt = clue.discoveredAt;
            console.log('🔍 更新线索发现时间:', clue.name);
        } else {
            // 添加新线索到游戏数据
            this.currentGame.script.clues.push(clue);
            console.log('🔍 新线索已添加到脚本:', clue.name);
        }

        // 检查是否已在发现列表中
        const alreadyDiscovered = this.currentGame.gameProgress.discoveredClues.find(c =>
            (typeof c === 'string' ? c : c.id) === clue.id
        );

        if (!alreadyDiscovered) {
            // 更新游戏进度
            if (!this.currentGame.gameProgress.discoveredClues) {
                this.currentGame.gameProgress.discoveredClues = [];
            }
            this.currentGame.gameProgress.discoveredClues.push(clue);

            // 触发线索发现事件
            this.emit('clueDiscovered', clue);
            console.log('🔍 发现新线索:', clue.name);

            // 通知线索管理器更新显示
            if (window.clueManager) {
                window.clueManager.addClue(clue);
                // 确保显示刷新
                setTimeout(() => {
                    if (window.clueManager.refreshCluesDisplay) {
                        window.clueManager.refreshCluesDisplay();
                    }
                }, 100);
            }
        }
    }

    /**
     * 更新角色怀疑度
     * @param {string} characterId - 角色ID
     * @param {number} change - 变化值
     */
    updateSuspicionLevel(characterId, change) {
        if (!this.currentGame) return;

        const current = this.currentGame.gameProgress.suspicionLevels[characterId] || 0;
        const newLevel = Math.max(0, Math.min(100, current + change));

        this.currentGame.gameProgress.suspicionLevels[characterId] = newLevel;

        this.emit('suspicionChanged', { characterId, oldLevel: current, newLevel });
    }

    /**
     * 提交推理结果
     * @param {Object} reasoning - 推理结果
     * @returns {Promise<Object>}
     */
    async submitReasoning(reasoning) {
        if (!this.currentGame || this.gameState !== 'playing') {
            throw new Error('游戏未开始或状态异常');
        }

        try {
            console.log('🧠 提交推理结果:', reasoning);

            // 验证推理
            const validation = await deepseekAPI.validateReasoning(reasoning, this.currentGame);

            // 更新游戏状态
            this.currentGame.gameProgress.reasoning = reasoning;
            this.currentGame.gameProgress.validation = validation.validation;
            this.currentGame.gameProgress.currentPhase = 'completed';
            this.currentGame.gameProgress.endTime = new Date().toISOString();
            
            this.gameState = 'completed';

            // 保存最终结果
            await this.saveGame();

            this.emit('reasoningSubmitted', {
                reasoning: reasoning,
                validation: validation.validation,
                truth: this.currentGame.script.truth
            });

            this.emit('gameCompleted', this.currentGame);

            console.log('✅ 推理提交完成，得分:', validation.validation.score);
            return {
                success: true,
                validation: validation.validation,
                truth: this.currentGame.script.truth
            };

        } catch (error) {
            console.error('❌ 推理提交失败:', error);
            throw error;
        }
    }

    /**
     * 保存游戏
     */
    async saveGame() {
        if (!this.currentGame) return;

        try {
            const response = await fetch('/api/game/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.currentGame)
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error);
            }

            // 保存到本地存储
            const storageKey = (window.CONFIG?.STORAGE_KEYS?.currentGame) || 'ai_reasoning_game_current';
            const utils = window.Utils || { storage: { set: () => {} } };
            utils.storage.set(storageKey, this.currentGame);

            console.log('💾 游戏保存成功');
        } catch (error) {
            console.error('❌ 游戏保存失败:', error);
        }
    }

    /**
     * 保存游戏进度
     */
    async saveGameProgress() {
        if (!this.currentGame || !this.gameId) return;

        try {
            const response = await fetch(`/api/game/progress/${this.gameId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.currentGame.gameProgress)
            });

            const result = await response.json();
            if (!result.success) {
                console.warn('游戏进度保存失败:', result.error);
            }
        } catch (error) {
            console.warn('游戏进度保存失败:', error);
        }
    }

    /**
     * 加载上次的游戏
     */
    loadLastGame() {
        const storageKey = (window.CONFIG?.STORAGE_KEYS?.currentGame) || 'ai_reasoning_game_current';
        const utils = window.Utils || { storage: { get: () => null } };
        const savedGame = utils.storage.get(storageKey);
        if (savedGame && savedGame.gameProgress.currentPhase !== 'completed') {
            this.currentGame = savedGame;
            this.gameId = savedGame.id;
            this.gameState = 'playing';
            
            console.log('📂 加载上次游戏:', this.gameId);
            this.emit('gameLoaded', this.currentGame);
        }
    }

    /**
     * 等待API密钥加载完成
     */
    async waitForAPIKeys() {
        // 等待密钥加载完成
        let attempts = 0;
        const maxAttempts = 30; // 最多等待3秒

        while (attempts < maxAttempts) {
            if (deepseekAPI.keyLoaded && tongYiAPI.keyLoaded) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        // 检查密钥是否已加载
        if (!deepseekAPI.apiKey) {
            throw new Error('DeepSeek API密钥未配置，请在.env文件中设置DEEPSEEK_API_KEY');
        }

        if (!tongYiAPI.apiKey) {
            throw new Error('通义万相API密钥未配置，请在.env文件中设置TONGYI_API_KEY');
        }

        console.log('✅ API密钥加载完成');
    }

    /**
     * 初始化角色怀疑度
     * @param {Array} characters - 角色列表
     * @returns {Object}
     */
    initializeSuspicionLevels(characters) {
        const levels = {};
        characters.forEach(character => {
            levels[character.id] = character.suspicionLevel || 0;
        });
        return levels;
    }

    /**
     * 初始化可用角色列表
     * @param {Array} characters - 所有角色列表
     * @returns {Array} 初始可用的角色ID列表
     */
    initializeAvailableCharacters(characters) {
        return characters
            .filter(character => character.isInitiallyAvailable !== false)
            .map(character => character.id);
    }

    /**
     * 从回复文本中检测角色提及
     * @param {string} responseText - AI回复文本
     * @param {string} question - 用户问题
     * @returns {Array} 检测到的角色提及
     */
    detectCharacterMentions(responseText, question) {
        const mentions = [];
        const hiddenCharacters = this.currentGame.script.characters.filter(char =>
            !this.currentGame.gameProgress.availableCharacters.includes(char.id)
        );

        console.log('🔧 检查隐藏角色:', hiddenCharacters.map(c => c.name));
        console.log('🔧 回复文本:', responseText);
        console.log('🔧 用户问题:', question);

        for (const character of hiddenCharacters) {
            if (character.mentionTriggers) {
                for (const trigger of character.mentionTriggers) {
                    const triggerLower = trigger.toLowerCase();
                    const responseTextLower = responseText.toLowerCase();
                    const questionLower = question.toLowerCase();

                    console.log(`🔧 检查触发词 "${trigger}" 在回复中:`, responseTextLower.includes(triggerLower));
                    console.log(`🔧 检查触发词 "${trigger}" 在问题中:`, questionLower.includes(triggerLower));

                    if (responseTextLower.includes(triggerLower) || questionLower.includes(triggerLower)) {
                        mentions.push({
                            name: character.name,
                            context: `对话中提到了"${trigger}"`,
                            relationship: '相关人员',
                            hint: `可能与${character.name}有关`
                        });
                        console.log(`🔍 检测到角色提及: ${character.name} (触发词: ${trigger})`);
                        break; // 找到一个触发词就够了
                    }
                }
            }
        }

        return mentions;
    }

    /**
     * 处理对话中提及的新角色
     * @param {Array} mentionedCharacters - 提及的角色信息
     * @returns {Promise<Array>} 新发现的角色列表
     */
    async processMentionedCharacters(mentionedCharacters) {
        const discoveredCharacters = [];
        console.log('🔧 处理角色提及:', mentionedCharacters);

        for (const mention of mentionedCharacters) {
            console.log('🔧 处理提及:', mention);

            // 查找是否有匹配的隐藏角色
            const hiddenCharacter = this.currentGame.script.characters.find(char =>
                char.name === mention.name &&
                !this.currentGame.gameProgress.availableCharacters.includes(char.id)
            );

            console.log('🔧 找到匹配的隐藏角色:', hiddenCharacter?.name);

            if (hiddenCharacter) {
                // 检查是否满足发现条件
                const shouldDiscover = this.shouldDiscoverCharacter(hiddenCharacter, mention);
                console.log('🔧 是否应该发现角色:', shouldDiscover);

                if (shouldDiscover) {
                    // 将角色添加到可用列表
                    this.currentGame.gameProgress.availableCharacters.push(hiddenCharacter.id);
                    this.currentGame.gameProgress.discoveredCharacters.push({
                        characterId: hiddenCharacter.id,
                        discoveredAt: new Date().toISOString(),
                        discoveredThrough: mention.context,
                        mentionedBy: mention.relationship
                    });

                    discoveredCharacters.push({
                        character: hiddenCharacter,
                        context: mention.context,
                        hint: mention.hint
                    });

                    console.log(`🔍 发现新角色: ${hiddenCharacter.name}`);
                }
            } else {
                console.log('🔧 没有找到匹配的隐藏角色，提及的名字:', mention.name);
            }
        }

        return discoveredCharacters;
    }

    /**
     * 判断是否应该发现某个角色
     * @param {Object} character - 角色信息
     * @param {Object} mention - 提及信息
     * @returns {boolean}
     */
    shouldDiscoverCharacter(character, mention) {
        console.log('🔧 检查角色发现条件:');
        console.log('🔧 角色:', character.name);
        console.log('🔧 角色触发词:', character.mentionTriggers);
        console.log('🔧 提及上下文:', mention.context);

        // 如果角色有特定的触发关键词
        if (character.mentionTriggers && character.mentionTriggers.length > 0) {
            const contextLower = mention.context.toLowerCase();
            const shouldDiscover = character.mentionTriggers.some(trigger => {
                const triggerLower = trigger.toLowerCase();
                const matches = contextLower.includes(triggerLower);
                console.log(`🔧 检查触发词 "${trigger}": ${matches}`);
                return matches;
            });
            console.log('🔧 基于触发词的发现结果:', shouldDiscover);
            return shouldDiscover;
        }

        // 默认情况下，如果被明确提及就发现
        console.log('🔧 没有触发词，默认发现');
        return true;
    }

    /**
     * 获取当前可用的角色列表
     * @returns {Array} 可用角色列表
     */
    getAvailableCharacters() {
        if (!this.currentGame) return [];

        return this.currentGame.script.characters.filter(character =>
            this.currentGame.gameProgress.availableCharacters.includes(character.id)
        );
    }

    /**
     * 设置自动保存
     */
    setupAutoSave() {
        setInterval(() => {
            if (this.currentGame && this.gameState === 'playing') {
                this.saveGameProgress();
            }
        }, (window.CONFIG?.GAME?.autoSaveInterval) || 60000);
    }

    /**
     * 重置游戏
     */
    resetGame() {
        this.currentGame = null;
        this.gameId = null;
        this.gameState = 'idle';
        
        const storageKey = (window.CONFIG?.STORAGE_KEYS?.currentGame) || 'ai_reasoning_game_current';
        const utils = window.Utils || { storage: { remove: () => {} } };
        utils.storage.remove(storageKey);
        
        this.emit('gameReset');
        console.log('🔄 游戏已重置');
    }

    /**
     * 获取游戏统计信息
     * @returns {Object}
     */
    getGameStats() {
        if (!this.currentGame) return null;

        const progress = this.currentGame.gameProgress;
        return {
            gameId: this.currentGame.id,
            phase: progress.currentPhase,
            cluesFound: progress.discoveredClues.length,
            totalClues: this.currentGame.script.clues.length,
            conversationsCount: progress.conversationHistory.length,
            playTime: progress.startTime ? 
                Date.now() - new Date(progress.startTime).getTime() : 0,
            suspicionLevels: progress.suspicionLevels
        };
    }
}

// 创建全局实例
window.gameController = new GameController();
