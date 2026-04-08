/**
 * DeepSeek API集成模块
 * 负责与DeepSeek API的所有交互，包括剧本生成、角色对话、推理验证等
 */

class DeepSeekAPI {
    constructor() {
        // 使用默认配置以防CONFIG未加载
        const defaultConfig = {
            baseURL: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-chat',
            maxTokens: 4000,
            temperature: 0.7
        };

        this.baseURL = (window.CONFIG?.APIs?.DEEPSEEK?.baseURL) || defaultConfig.baseURL;
        this.model = (window.CONFIG?.APIs?.DEEPSEEK?.model) || defaultConfig.model;
        this.maxTokens = (window.CONFIG?.APIs?.DEEPSEEK?.maxTokens) || defaultConfig.maxTokens;
        this.temperature = (window.CONFIG?.APIs?.DEEPSEEK?.temperature) || defaultConfig.temperature;
        this.apiKey = null;
        this.keyLoaded = false;

        // 异步加载API密钥
        this.loadApiKey().then(() => {
            this.keyLoaded = true;
        });
    }

    /**
     * 设置API密钥
     * @param {string} apiKey - DeepSeek API密钥
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        // 保存到本地存储
        const storageKey = (window.CONFIG?.STORAGE_KEYS?.apiKeys) || 'ai_reasoning_game_api_keys';
        const utils = window.Utils || { storage: { set: () => {}, get: () => ({}) } };

        utils.storage.set(storageKey, {
            ...utils.storage.get(storageKey, {}),
            deepseek: apiKey
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

            if (result.success && result.config.deepseek) {
                this.apiKey = result.config.deepseek;
                console.log('✅ DeepSeek API密钥已从环境变量加载');
                return;
            }
        } catch (error) {
            console.warn('从后端获取API密钥失败，尝试本地存储:', error);
        }

        // 如果后端没有配置，则从本地存储获取
        const storageKey = (window.CONFIG?.STORAGE_KEYS?.apiKeys) || 'ai_reasoning_game_api_keys';
        const utils = window.Utils || { storage: { get: () => ({}) } };
        const keys = utils.storage.get(storageKey, {});
        this.apiKey = keys.deepseek || null;

        if (this.apiKey) {
            console.log('✅ DeepSeek API密钥已从本地存储加载');
        } else {
            console.warn('⚠️ 未找到DeepSeek API密钥');
        }
    }

    /**
     * 验证API密钥是否有效
     * @returns {Promise<boolean>}
     */
    async validateApiKey() {
        if (!this.apiKey) return false;
        
        try {
            const response = await this.callAPI([
                { role: 'user', content: 'test' }
            ], { maxTokens: 1 });
            return response.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * 调用DeepSeek API的核心方法
     * @param {Array} messages - 消息数组
     * @param {Object} options - 可选参数
     * @returns {Promise<Object>}
     */
    async callAPI(messages, options = {}) {
        if (!this.apiKey) {
            const errorMessage = (window.CONFIG?.ERROR_MESSAGES?.API_KEY_MISSING) || 'API密钥未配置';
            throw new Error(errorMessage);
        }

        const requestData = {
            messages: messages,
            temperature: options.temperature || this.temperature,
            max_tokens: options.maxTokens || this.maxTokens,
            response_format: options.responseFormat || undefined
        };

        try {
            const response = await fetch('/api/deepseek/chat', {
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

            return {
                success: true,
                content: result.data.choices[0].message.content,
                usage: result.data.usage
            };
        } catch (error) {
            console.error('DeepSeek API调用失败:', error);
            const errorMessage = error.message || (window.CONFIG?.ERROR_MESSAGES?.NETWORK_ERROR) || '网络连接失败';
            throw new Error(errorMessage);
        }
    }

    /**
     * 生成推理剧本
     * @param {Object} gameConfig - 游戏配置
     * @param {Object} authorStyle - 作家风格（可选）
     * @returns {Promise<Object>}
     */
    async generateScript(gameConfig, authorStyle = null) {
        const { gameType, gameStyle, customPrompt } = gameConfig;
        
        // 构建JSON格式的提示词
        const gameTypeStyle = window.CONFIG?.GAME?.gameTypes?.[gameType]?.style || gameType;
        const gameStyleImage = window.CONFIG?.GAME?.gameStyles?.[gameStyle]?.imageStyle || gameStyle;

        // 如果有作家风格，生成风格化提示词
        let stylePrompt = '';
        if (authorStyle) {
            try {
                const styleData = await authorStyleAPI.generateStylePrompt(authorStyle._id, `${gameTypeStyle} ${customPrompt || '经典推理案件'}`);
                stylePrompt = `\n\n写作风格要求：\n${styleData.prompt}`;
            } catch (error) {
                console.warn('获取风格化提示词失败，使用默认风格:', error);
            }
        }

        const prompt = `生成推理剧本JSON：

类型：${gameTypeStyle}
风格：${gameStyleImage}
描述：${customPrompt || '经典推理案件'}${stylePrompt}

JSON格式：
{
  "title": "案件标题",
  "background": "案件背景",
  "location": "案发地点",
  "initialCharacters": [
    {
      "id": "char1",
      "name": "姓名",
      "age": 30,
      "role": "witness",
      "personality": "性格",
      "background": "背景",
      "appearance": "外貌",
      "relationships": {"char2": "关系"},
      "secrets": ["秘密"],
      "alibi": "证明",
      "suspicionLevel": 0,
      "isInitiallyAvailable": true
    }
  ],
  "hiddenCharacters": [
    {
      "id": "char2",
      "name": "姓名",
      "age": 30,
      "role": "suspect",
      "personality": "性格",
      "background": "背景",
      "appearance": "外貌",
      "relationships": {"char1": "关系"},
      "secrets": ["秘密"],
      "alibi": "证明",
      "suspicionLevel": 0,
      "isInitiallyAvailable": false,
      "mentionTriggers": ["关键词1", "关键词2"],
      "discoveryHints": "如何在对话中提及这个角色的线索"
    }
  ],
  "clues": [
    {
      "id": "clue1",
      "name": "线索名",
      "description": "描述",
      "location": "地点",
      "importance": "high",
      "relatedCharacters": ["char1"],
      "discoveredAt": null
    }
  ],
  "truth": {
    "killer": "凶手",
    "method": "手法",
    "motive": "动机",
    "timeline": "时间线"
  }
}

生成1-2个初始角色（证人、报案人等），3-4个隐藏角色（必须包含至少2个嫌疑人），5-6条线索。初始角色应该能够通过对话提及隐藏角色。确保有足够的嫌疑人供玩家选择凶手。`;

        // 构建系统提示词
        let systemPrompt = '你是一个专业的推理小说作家，擅长创作逻辑严密、线索丰富的推理剧本。';

        if (authorStyle) {
            systemPrompt += `\n\n你需要模仿${authorStyle.chineseName}(${authorStyle.name})的写作风格：
- 文学特点：${authorStyle.style.characteristics}
- 叙述风格：${authorStyle.style.narrativeStyle}
- 语言特色：${authorStyle.style.languageFeatures.join('、')}
- 情节结构：${authorStyle.plotStructure.openingStyle}`;
        }

        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        try {
            const response = await this.callAPI(messages, {
                temperature: 0.8,
                maxTokens: 6000,
                responseFormat: { type: 'json_object' }
            });
            
            // 解析JSON响应
            const scriptData = this.parseScriptJSON(response.content);

            // 处理渐进式角色发现结构
            scriptData.characters = this.processCharacterStructure(scriptData);

            // 验证剧本数据完整性
            this.validateScriptData(scriptData);
            
            return {
                success: true,
                script: scriptData,
                usage: response.usage
            };
        } catch (error) {
            console.error('剧本生成失败:', error);
            throw new Error(`剧本生成失败: ${error.message}`);
        }
    }

    /**
     * 角色扮演对话
     * @param {Object} character - 角色信息
     * @param {string} userQuestion - 用户问题
     * @param {Object} context - 对话上下文
     * @returns {Promise<Object>}
     */
    async rolePlayCharacter(character, userQuestion, context = {}) {
        const { conversationHistory = [], currentPhase = 'investigation' } = context;
        
        // 构建角色扮演提示词 - JSON格式输出
        const rolePlayPrompt = `你现在要扮演推理游戏中的角色：${character.name}

角色信息：
- 姓名：${character.name}
- 年龄：${character.age}
- 身份：${character.role}
- 性格：${character.personality}
- 背景：${character.background}
- 秘密：${JSON.stringify(character.secrets)}
- 人际关系：${JSON.stringify(character.relationships)}

当前阶段：${currentPhase}
对话历史：${this.formatConversationHistory(conversationHistory)}

用户问题：${userQuestion}

请以这个角色的身份回答用户的问题，并以JSON格式输出：

{
  "response": "角色的回答内容",
  "emotion": "当前情绪状态",
  "newClues": [
    {
      "id": "clue_id",
      "name": "线索名称",
      "description": "线索描述",
      "importance": "high|medium|low"
    }
  ],
  "mentionedCharacters": [
    {
      "name": "提及的角色姓名",
      "context": "提及的上下文",
      "relationship": "与该角色的关系",
      "hint": "关于该角色的暗示信息"
    }
  ],
  "suspicionChange": 0,
  "characterState": "角色当前状态描述"
}

**重要提示：**
1. 当用户询问关于私生活、感情、离婚、前妻、版权、出版等敏感话题时，你应该在回答中提及相关的其他角色
2. 如果用户问到与你有关系的其他人，请在mentionedCharacters中包含他们的信息
3. 即使你不愿意详细讨论某个话题，也要暗示存在相关的人物
4. mentionedCharacters数组不能为空，至少要提及一个相关角色

请确保回答符合角色性格，适当透露或隐瞒信息。在对话中自然地提及其他相关角色，为玩家提供发现新角色的线索。`;

        const messages = [
            {
                role: 'user',
                content: rolePlayPrompt
            }
        ];

        try {
            const response = await this.callAPI(messages, {
                temperature: 0.9,
                maxTokens: 500,
                responseFormat: { type: 'json_object' }
            });
            
            // 解析JSON响应
            let responseData;
            try {
                responseData = JSON.parse(response.content);
            } catch (error) {
                // 如果解析失败，使用原有的分析方法
                const clueAnalysis = await this.analyzeResponseForClues(
                    response.content,
                    character,
                    userQuestion
                );
                responseData = {
                    response: response.content,
                    newClues: clueAnalysis.clues,
                    mentionedCharacters: [],
                    suspicionChange: clueAnalysis.suspicionChange
                };
            }

            return {
                success: true,
                response: responseData.response,
                character: character,
                newClues: responseData.newClues || [],
                mentionedCharacters: responseData.mentionedCharacters || [],
                suspicionChange: responseData.suspicionChange || 0,
                emotion: responseData.emotion,
                characterState: responseData.characterState,
                usage: response.usage
            };
        } catch (error) {
            console.error('角色对话失败:', error);
            throw new Error(`角色对话失败: ${error.message}`);
        }
    }

    /**
     * 提取推理链条
     * @param {Object} script - 剧本数据
     * @returns {Promise<Object>}
     */
    async extractReasoningChain(script) {
        const prompt = `请分析以下推理剧本，提取关键的推理链条和逻辑关系：

剧本信息：
${JSON.stringify(script, null, 2)}

请返回JSON格式的推理链条分析：
{
  "keyEvents": [
    {
      "id": "event_1",
      "description": "关键事件描述",
      "timestamp": "时间点",
      "participants": ["参与角色"],
      "evidence": ["相关证据"],
      "importance": "high/medium/low"
    }
  ],
  "causalRelations": [
    {
      "cause": "原因事件ID",
      "effect": "结果事件ID",
      "strength": "strong/medium/weak",
      "description": "因果关系描述"
    }
  ],
  "evidenceChain": [
    {
      "clueId": "线索ID",
      "connects": ["连接的其他线索ID"],
      "significance": "在推理中的重要性说明"
    }
  ],
  "timeline": [
    {
      "time": "时间点",
      "event": "事件描述",
      "location": "地点",
      "witnesses": ["目击者"]
    }
  ]
}`;

        const messages = [
            {
                role: 'system',
                content: '你是一个逻辑分析专家，擅长从复杂信息中提取关键的推理链条和因果关系。'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        try {
            const response = await this.callAPI(messages, {
                temperature: 0.3,
                maxTokens: 4000,
                responseFormat: { type: 'json_object' }
            });
            
            const reasoningChain = JSON.parse(response.content);
            
            return {
                success: true,
                reasoningChain: reasoningChain,
                usage: response.usage
            };
        } catch (error) {
            console.error('推理链条提取失败:', error);
            throw new Error(`推理链条提取失败: ${error.message}`);
        }
    }

    /**
     * 验证用户推理
     * @param {Object} userReasoning - 用户推理结果
     * @param {Object} gameData - 游戏数据
     * @returns {Promise<Object>}
     */
    async validateReasoning(userReasoning, gameData) {
        const { script, gameProgress } = gameData;
        
        const validationPrompt = window.CONFIG?.PROMPTS?.REASONING_VALIDATION || `请分析用户的推理结果：

案件真相：{truth}
用户推理：{userReasoning}
已发现线索：{discoveredClues}

请评估推理的准确性并返回JSON格式结果。`;

        // 获取凶手名称（如果传入的是ID，需要转换为名称）
        let killerName = userReasoning.killer;
        if (userReasoning.killer && script.characters) {
            const killerCharacter = script.characters.find(c => c.id === userReasoning.killer);
            if (killerCharacter) {
                killerName = killerCharacter.name;
            }
        }

        const prompt = `请分析用户的推理结果并返回JSON格式的评估：

案件真相：
凶手：${script.truth.killer}
作案手法：${script.truth.method}
作案动机：${script.truth.motive}

用户推理：
凶手：${killerName}
推理过程：${userReasoning.reasoning}

已发现线索：${JSON.stringify(gameProgress.discoveredClues || [])}

请严格按照以下JSON格式返回评估结果（不要包含任何markdown标记）：
{
  "correct": true,
  "accuracy": 85,
  "feedback": "详细的推理分析反馈",
  "suggestions": ["改进建议1", "改进建议2"],
  "score": 85,
  "correctKiller": "真正的凶手姓名",
  "analysis": {
    "factAccuracy": 90,
    "logicCompleteness": 80,
    "evidenceStrength": 85
  }
}`;

        const messages = [
            {
                role: 'system',
                content: '你是一个推理验证专家。你必须严格按照JSON格式返回结果，不要使用markdown代码块标记，直接返回纯JSON对象。'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        try {
            const response = await this.callAPI(messages, {
                temperature: 0.2,
                maxTokens: 2000,
                responseFormat: { type: 'json_object' }
            });

            // 使用修复的JSON解析方法
            const validation = this.parseValidationJSON(response.content);

            return {
                success: true,
                validation: validation,
                usage: response.usage
            };
        } catch (error) {
            console.error('推理验证失败:', error);
            throw new Error(`推理验证失败: ${error.message}`);
        }
    }

    /**
     * 解析验证结果JSON数据
     * @param {string} content - API返回的内容
     * @returns {Object}
     */
    parseValidationJSON(content) {
        try {
            // 直接解析
            return JSON.parse(content);
        } catch (error) {
            console.warn('直接JSON解析失败，尝试清理格式:', error.message);
            console.log('原始内容:', content);

            try {
                // 移除markdown代码块标记
                let cleanContent = content.trim();

                // 移除开头的```json或```
                cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/i, '');

                // 移除结尾的```
                cleanContent = cleanContent.replace(/\n?\s*```\s*$/i, '');

                // 移除可能的转义字符
                cleanContent = cleanContent.replace(/\\n/g, '\n').replace(/\\"/g, '"');

                console.log('清理后内容:', cleanContent);

                // 再次尝试解析
                return JSON.parse(cleanContent);
            } catch (secondError) {
                console.warn('清理后仍解析失败，尝试提取JSON部分:', secondError.message);

                try {
                    // 尝试提取JSON对象
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        let extractedJson = jsonMatch[0];
                        // 清理提取的JSON
                        extractedJson = extractedJson.replace(/\\n/g, '\n').replace(/\\"/g, '"');
                        return JSON.parse(extractedJson);
                    }

                    // 如果都失败了，返回默认结构
                    console.error('无法解析验证结果，使用默认结构');
                    return {
                        correct: false,
                        accuracy: 50,
                        feedback: '推理验证过程中出现技术问题，请重试',
                        suggestions: ['请重新提交推理结果'],
                        score: 50,
                        correctKiller: '未知',
                        analysis: {
                            factAccuracy: 50,
                            logicCompleteness: 50,
                            evidenceStrength: 50
                        }
                    };
                } catch (finalError) {
                    throw new Error('验证结果解析完全失败');
                }
            }
        }
    }

    /**
     * 处理角色结构，合并初始角色和隐藏角色
     * @param {Object} scriptData - 剧本数据
     * @returns {Array} 处理后的角色数组
     */
    processCharacterStructure(scriptData) {
        let allCharacters = [];

        // 处理初始角色
        if (scriptData.initialCharacters) {
            allCharacters = allCharacters.concat(scriptData.initialCharacters);
        }

        // 处理隐藏角色
        if (scriptData.hiddenCharacters) {
            allCharacters = allCharacters.concat(scriptData.hiddenCharacters);
        }

        // 如果使用旧格式，直接返回characters
        if (scriptData.characters && !scriptData.initialCharacters && !scriptData.hiddenCharacters) {
            // 兼容旧格式，确保有足够的嫌疑人
            const processedChars = scriptData.characters.map((char, index) => ({
                ...char,
                isInitiallyAvailable: index < 2 || char.role === 'witness', // 证人始终可见
                mentionTriggers: index >= 2 && char.role !== 'witness' ? [char.name, char.role] : undefined,
                discoveryHints: index >= 2 && char.role !== 'witness' ? `可能会在对话中提及${char.name}` : undefined
            }));

            // 确保至少有2个嫌疑人
            const suspects = processedChars.filter(char => char.role === 'suspect');
            if (suspects.length < 2) {
                console.warn('⚠️ 嫌疑人数量不足，调整角色设置');
                // 将一些角色转换为嫌疑人
                processedChars.forEach((char, index) => {
                    if (char.role !== 'witness' && char.role !== 'victim' && suspects.length < 3) {
                        char.role = 'suspect';
                        suspects.push(char);
                    }
                });
            }

            return processedChars;
        }

        return allCharacters;
    }

    /**
     * 解析剧本JSON数据
     * @param {string} content - API返回的内容
     * @returns {Object}
     */
    parseScriptJSON(content) {
        try {
            // 尝试直接解析
            return JSON.parse(content);
        } catch (error) {
            // 如果直接解析失败，尝试提取JSON部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('无法解析剧本数据');
        }
    }

    /**
     * 验证剧本数据完整性
     * @param {Object} scriptData - 剧本数据
     */
    validateScriptData(scriptData) {
        const required = ['title', 'background', 'characters', 'clues', 'truth'];
        for (const field of required) {
            if (!scriptData[field]) {
                throw new Error(`剧本数据缺少必要字段: ${field}`);
            }
        }
        
        if (!Array.isArray(scriptData.characters) || scriptData.characters.length < 3) {
            throw new Error('角色数量不足，至少需要3个角色');
        }
        
        if (!Array.isArray(scriptData.clues) || scriptData.clues.length < 5) {
            throw new Error('线索数量不足，至少需要5条线索');
        }
    }

    /**
     * 格式化对话历史
     * @param {Array} history - 对话历史
     * @returns {string}
     */
    formatConversationHistory(history) {
        if (!history || history.length === 0) {
            return '暂无对话历史';
        }
        
        return history.slice(-5).map(conv => 
            `${conv.character}: ${conv.response}`
        ).join('\n');
    }

    /**
     * 分析回答中的线索
     * @param {string} response - 角色回答
     * @param {Object} character - 角色信息
     * @param {string} question - 用户问题
     * @returns {Promise<Object>}
     */
    async analyzeResponseForClues(response, character, question) {
        // 简化版本：基于关键词检测
        const clueKeywords = ['发现', '看到', '听到', '注意到', '记得', '证据', '线索'];
        const hasClue = clueKeywords.some(keyword => response.includes(keyword));
        
        let suspicionChange = 0;
        const suspiciousWords = ['紧张', '回避', '撒谎', '隐瞒', '可疑'];
        const innocentWords = ['坦诚', '直接', '配合', '帮助', '真诚'];
        
        if (suspiciousWords.some(word => response.includes(word))) {
            suspicionChange = 10;
        } else if (innocentWords.some(word => response.includes(word))) {
            suspicionChange = -5;
        }
        
        return {
            clues: hasClue ? [{
                id: Utils.generateId(),
                name: '对话线索',
                description: `从与${character.name}的对话中获得的信息`,
                source: character.name,
                content: response
            }] : [],
            suspicionChange: suspicionChange
        };
    }

    /**
     * 格式化对话历史
     * @param {Array} history - 对话历史
     * @returns {string}
     */
    formatConversationHistory(history) {
        if (!history || history.length === 0) {
            return '暂无对话历史';
        }

        return history.slice(-3).map((conv, index) =>
            `${index + 1}. 问：${conv.question}\n   答：${conv.response}`
        ).join('\n');
    }
}

// 创建全局实例
window.deepseekAPI = new DeepSeekAPI();
