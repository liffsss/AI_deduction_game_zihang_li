// 应用配置文件
const CONFIG = {
    // API配置
    APIs: {
        DEEPSEEK: {
            baseURL: 'https://api.deepseek.com/v1',
            model: 'deepseek-chat',
            maxTokens: 4000,
            temperature: 0.7
        },
        TONGYI: {
            baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
            model: 'wanx-v1',
            imageSize: '1024*1024',
            style: '<photography>'
        }
    },

    // 游戏配置
    GAME: {
        maxCharacters: 6,
        maxClues: 10,
        conversationTimeout: 30000, // 30秒
        autoSaveInterval: 60000, // 1分钟

        // 游戏类型配置
        gameTypes: {
            classic: {
                name: '经典推理',
                description: '传统的密室杀人案，注重逻辑推理',
                style: '阿加莎·克里斯蒂风格，密室推理，逻辑严密'
            },
            modern: {
                name: '现代悬疑',
                description: '现代都市背景的悬疑案件',
                style: '现代都市，科技元素，心理悬疑'
            },
            historical: {
                name: '历史谜案',
                description: '历史背景下的神秘案件',
                style: '历史背景，古典氛围，文化元素'
            },
            fantasy: {
                name: '奇幻推理',
                description: '带有奇幻元素的推理故事',
                style: '奇幻世界，魔法元素，超自然现象'
            }
        },

        // 风格配置
        gameStyles: {
            noir: {
                name: '黑色电影',
                description: '黑暗、阴郁的氛围',
                imageStyle: '黑色电影风格，阴暗光线，高对比度'
            },
            cozy: {
                name: '温馨推理',
                description: '轻松愉快的推理氛围',
                imageStyle: '温馨明亮，柔和光线，舒适环境'
            },
            thriller: {
                name: '惊悚悬疑',
                description: '紧张刺激的悬疑氛围',
                imageStyle: '紧张氛围，戏剧性光线，悬疑感'
            },
            detective: {
                name: '侦探小说',
                description: '经典侦探小说风格',
                imageStyle: '经典侦探风格，复古氛围，专业感'
            }
        }
    },

    // UI配置
    UI: {
        animationDuration: 300,
        notificationDuration: 3000,
        loadingMinDuration: 1000,

        // 颜色主题
        colors: {
            primary: '#3498db',
            secondary: '#2ecc71',
            danger: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db',
            success: '#2ecc71',
            dark: '#2c3e50',
            light: '#ecf0f1'
        },

        // 关系图配置
        relationshipGraph: {
            width: 280,
            height: 280,
            nodeRadius: 20,
            linkDistance: 80,
            chargeStrength: -200
        }
    },

    // 本地存储键名
    STORAGE_KEYS: {
        currentGame: 'ai_reasoning_game_current',
        gameHistory: 'ai_reasoning_game_history',
        userPreferences: 'ai_reasoning_game_preferences',
        apiKeys: 'ai_reasoning_game_api_keys'
    },

    // 错误消息
    ERROR_MESSAGES: {
        API_KEY_MISSING: 'API密钥未配置，请在设置中添加',
        NETWORK_ERROR: '网络连接失败，请检查网络设置',
        GENERATION_FAILED: '内容生成失败，请重试',
        INVALID_INPUT: '输入内容无效，请检查后重试',
        GAME_LOAD_FAILED: '游戏加载失败',
        SAVE_FAILED: '保存失败'
    },

    // 成功消息
    SUCCESS_MESSAGES: {
        GAME_GENERATED: '游戏生成成功！',
        CLUE_DISCOVERED: '发现新线索！',
        CONVERSATION_SAVED: '对话已保存',
        REASONING_SUBMITTED: '推理已提交',
        GAME_COMPLETED: '游戏完成！'
    },

    // 提示词模板
    PROMPTS: {
        // 剧本生成提示词
        SCRIPT_GENERATION: `请根据以下要求生成一个推理剧本：

游戏类型：{gameType}
风格设定：{gameStyle}
用户描述：{userPrompt}

请生成包含以下结构的JSON格式剧本：
{
  "title": "案件标题",
  "background": "案件背景描述（200-300字）",
  "location": "案发地点详细描述",
  "timeframe": "案发时间",
  "characters": [
    {
      "id": "character_1",
      "name": "角色姓名",
      "age": 年龄,
      "role": "身份角色（suspect/witness/victim/detective）",
      "appearance": "外貌描述",
      "personality": "性格特点",
      "background": "背景故事",
      "motive": "作案动机（如果是嫌疑人）",
      "alibi": "不在场证明",
      "secrets": ["秘密信息1", "秘密信息2"],
      "relationships": {
        "character_id": "关系描述"
      },
      "suspicionLevel": 初始怀疑度(0-100)
    }
  ],
  "clues": [
    {
      "id": "clue_1",
      "name": "线索名称",
      "description": "线索详细描述",
      "location": "发现地点",
      "importance": "high/medium/low",
      "relatedCharacters": ["相关角色ID"],
      "discoveryCondition": "发现条件"
    }
  ],
  "truth": {
    "killer": "凶手角色ID",
    "method": "作案手法详细描述",
    "motive": "真实作案动机",
    "timeline": "详细作案时间线",
    "evidence": "关键证据说明"
  }
}

要求：
1. 确保逻辑严密，线索环环相扣
2. 角色动机合理，性格鲜明
3. 至少包含3-5个主要角色
4. 至少包含5-8条重要线索
5. 真相要有足够的证据支撑`,

        // 角色扮演提示词
        ROLE_PLAY: `你现在要扮演推理游戏中的角色：{characterName}

角色信息：
- 姓名：{characterName}
- 年龄：{characterAge}
- 身份：{characterRole}
- 性格：{characterPersonality}
- 背景：{characterBackground}
- 秘密：{characterSecrets}
- 与其他角色的关系：{characterRelationships}

当前情况：
{currentContext}

对话历史：
{conversationHistory}

用户问题：{userQuestion}

请以这个角色的身份回答用户的问题，注意：
1. 保持角色性格和说话方式的一致性
2. 根据角色的秘密和立场决定透露信息的程度
3. 如果是凶手，要巧妙隐瞒真相但不能直接撒谎
4. 回答要自然真实，符合角色的知识水平和社会地位
5. 可以表现出情绪变化，如紧张、愤怒、悲伤等
6. 回答长度控制在50-150字之间

请直接以角色身份回答，不要加任何解释或旁白。`,

        // 推理验证提示词
        REASONING_VALIDATION: `请分析用户的推理结果：

案件真相：
{truth}

用户推理：
凶手：{userKiller}
推理过程：{userReasoning}

已发现的线索：
{discoveredClues}

对话记录：
{conversationHistory}

请从以下维度评估用户的推理：
1. 事实准确性（凶手是否正确）
2. 逻辑完整性（推理过程是否合理）
3. 证据充分性（是否有足够证据支撑结论）

请返回JSON格式的评估结果：
{
  "correct": true/false,
  "score": 0-100,
  "analysis": {
    "factAccuracy": 0-100,
    "logicCompleteness": 0-100,
    "evidenceStrength": 0-100
  },
  "feedback": "详细反馈说明",
  "missingEvidence": ["缺失的关键证据"],
  "logicFlaws": ["逻辑漏洞说明"],
  "suggestions": ["改进建议"]
}`
    }
};

// 工具函数
const Utils = {
    // 获取配置值
    getConfig: (path) => {
        return path.split('.').reduce((obj, key) => obj && obj[key], CONFIG);
    },

    // 生成唯一ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 格式化时间
    formatTime: (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 延迟函数
    delay: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // 深拷贝
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },

    // 本地存储操作
    storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        }
    }
};

// 暴露到全局作用域
window.CONFIG = CONFIG;
window.Utils = Utils;

// 导出配置（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, Utils };
}
