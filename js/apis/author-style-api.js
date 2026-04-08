/**
 * 作家风格API调用模块
 * 提供作家风格相关的API接口调用功能
 */

class AuthorStyleAPI {
    constructor() {
        this.baseURL = '/api/author-style';
    }

    /**
     * 获取作家风格列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.limit - 每页数量
     * @param {string} params.genre - 文学流派筛选
     * @param {string} params.era - 时代筛选
     * @param {string} params.search - 搜索关键词
     * @returns {Promise<Object>} API响应
     */
    async getAuthorStyles(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.baseURL}/list${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '获取作家风格列表失败');
            }
            
            return result.data;
        } catch (error) {
            console.error('获取作家风格列表失败:', error);
            throw error;
        }
    }

    /**
     * 获取单个作家风格详情
     * @param {string} authorId - 作家ID
     * @returns {Promise<Object>} 作家风格详情
     */
    async getAuthorStyle(authorId) {
        try {
            const response = await fetch(`${this.baseURL}/${authorId}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '获取作家风格详情失败');
            }
            
            return result.data;
        } catch (error) {
            console.error('获取作家风格详情失败:', error);
            throw error;
        }
    }

    /**
     * 搜索相似的作家风格
     * @param {string} query - 搜索查询
     * @param {number} limit - 返回数量限制
     * @returns {Promise<Array>} 相似的作家风格列表
     */
    async searchSimilarStyles(query, limit = 5) {
        try {
            const response = await fetch(`${this.baseURL}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, limit })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '搜索相似风格失败');
            }
            
            return result.data;
        } catch (error) {
            console.error('搜索相似风格失败:', error);
            throw error;
        }
    }

    /**
     * 为游戏推荐作家风格
     * @param {string} gameType - 游戏类型
     * @param {Array<string>} themes - 主题列表
     * @param {number} limit - 推荐数量
     * @returns {Promise<Array>} 推荐的作家风格列表
     */
    async recommendStylesForGame(gameType, themes = [], limit = 3) {
        try {
            const response = await fetch(`${this.baseURL}/recommend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameType, themes, limit })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '推荐作家风格失败');
            }
            
            return result.data;
        } catch (error) {
            console.error('推荐作家风格失败:', error);
            throw error;
        }
    }

    /**
     * 生成风格化提示词
     * @param {string} authorId - 作家ID
     * @param {string} gameContext - 游戏背景
     * @returns {Promise<Object>} 生成的提示词和作家信息
     */
    async generateStylePrompt(authorId, gameContext) {
        try {
            const response = await fetch(`${this.baseURL}/generate-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ authorId, gameContext })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '生成风格化提示词失败');
            }
            
            return result.data;
        } catch (error) {
            console.error('生成风格化提示词失败:', error);
            throw error;
        }
    }

    /**
     * 批量初始化作家风格数据
     * @param {Array<Object>} authors - 作家数据数组
     * @returns {Promise<Array>} 初始化结果
     */
    async batchInitAuthors(authors) {
        try {
            const response = await fetch(`${this.baseURL}/batch-init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ authors })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '批量初始化失败');
            }
            
            return result.data;
        } catch (error) {
            console.error('批量初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取所有可用的文学流派
     * @returns {Array<string>} 文学流派列表
     */
    getAvailableGenres() {
        return [
            '推理小说',
            '侦探小说',
            '密室推理',
            '本格推理',
            '社会派推理',
            '硬汉推理',
            '哥特小说',
            '恐怖小说',
            '黑色小说',
            '犯罪小说',
            '悬疑小说'
        ];
    }

    /**
     * 获取所有可用的时代
     * @returns {Array<string>} 时代列表
     */
    getAvailableEras() {
        return [
            '19世纪中期',
            '19世纪末-20世纪初',
            '20世纪',
            '20世纪中期',
            '20世纪末-21世纪',
            '21世纪'
        ];
    }

    /**
     * 获取推荐的游戏类型
     * @returns {Array<string>} 游戏类型列表
     */
    getGameTypes() {
        return [
            '经典推理',
            '密室推理',
            '心理悬疑',
            '硬汉推理',
            '都市犯罪',
            '哥特悬疑',
            '社会推理',
            '超自然推理',
            '黑色悬疑',
            '情感悬疑'
        ];
    }

    /**
     * 格式化作家风格信息用于显示
     * @param {Object} author - 作家风格对象
     * @returns {Object} 格式化后的显示信息
     */
    formatAuthorForDisplay(author) {
        return {
            id: author._id,
            name: author.name,
            chineseName: author.chineseName,
            displayName: `${author.chineseName} (${author.name})`,
            nationality: author.nationality,
            era: author.era,
            genres: author.style.genre.join('、'),
            characteristics: author.style.characteristics,
            themes: author.style.themes.join('、'),
            representativeWorks: author.representativeWorks.join('、'),
            suitableFor: author.suitableFor.join('、'),
            similarity: author.similarity || 0
        };
    }
}

// 创建全局实例
const authorStyleAPI = new AuthorStyleAPI();

// 导出API实例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authorStyleAPI;
} else {
    window.authorStyleAPI = authorStyleAPI;
}
