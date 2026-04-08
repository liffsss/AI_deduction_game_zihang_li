const mongoose = require('mongoose');

// 作家风格数据模型
const AuthorStyleSchema = new mongoose.Schema({
    // 作家基本信息
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    chineseName: {
        type: String,
        required: true,
        trim: true
    },
    nationality: {
        type: String,
        required: true
    },
    era: {
        type: String,
        required: true
    },
    
    // 写作风格特征
    style: {
        // 文学流派
        genre: {
            type: [String],
            required: true
        },
        // 写作特点描述
        characteristics: {
            type: String,
            required: true
        },
        // 常用主题
        themes: {
            type: [String],
            required: true
        },
        // 叙述风格
        narrativeStyle: {
            type: String,
            required: true
        },
        // 语言特色
        languageFeatures: {
            type: [String],
            required: true
        }
    },
    
    // 情节结构偏好
    plotStructure: {
        // 开头方式
        openingStyle: {
            type: String,
            required: true
        },
        // 冲突类型
        conflictTypes: {
            type: [String],
            required: true
        },
        // 结局风格
        endingStyle: {
            type: String,
            required: true
        },
        // 节奏控制
        pacing: {
            type: String,
            required: true
        }
    },
    
    // 角色塑造特点
    characterization: {
        // 角色类型偏好
        characterTypes: {
            type: [String],
            required: true
        },
        // 对话风格
        dialogueStyle: {
            type: String,
            required: true
        },
        // 心理描写特点
        psychologicalDepth: {
            type: String,
            required: true
        }
    },
    
    // 环境描写特色
    settingDescription: {
        // 环境类型偏好
        preferredSettings: {
            type: [String],
            required: true
        },
        // 描写风格
        descriptiveStyle: {
            type: String,
            required: true
        },
        // 氛围营造
        atmosphereCreation: {
            type: String,
            required: true
        }
    },
    
    // 代表作品
    representativeWorks: {
        type: [String],
        required: true
    },
    
    // 适用场景
    suitableFor: {
        type: [String],
        required: true
    },
    
    // 向量化数据（用于RAG检索）
    embedding: {
        type: [Number],
        default: []
    },
    
    // 元数据
    metadata: {
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        tags: {
            type: [String],
            default: []
        },
        popularity: {
            type: Number,
            default: 0
        }
    }
});

// 更新时间中间件
AuthorStyleSchema.pre('save', function(next) {
    this.metadata.updatedAt = new Date();
    next();
});

// 创建文本索引用于搜索
AuthorStyleSchema.index({
    name: 'text',
    chineseName: 'text',
    'style.characteristics': 'text',
    'style.themes': 'text'
});

// 创建向量索引用于相似度搜索
AuthorStyleSchema.index({ embedding: '2dsphere' });

module.exports = mongoose.model('AuthorStyle', AuthorStyleSchema);
