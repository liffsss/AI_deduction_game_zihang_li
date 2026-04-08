/**
 * 线索管理组件
 * 负责线索的展示、分类和交互管理
 */

class ClueManager {
    constructor() {
        this.clues = [];
        this.filteredClues = [];
        this.currentFilter = 'all';
        this.sortBy = 'importance';

        // DOM元素
        this.elements = {
            cluesList: null,
            cluesFilter: null,
            cluesSort: null,
            cluesSearch: null,
            cluesCount: null
        };

        this.init();
    }

    /**
     * 初始化线索管理器
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.createFilterControls();
        console.log('✅ 线索管理器初始化完成');
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements.cluesList = document.getElementById('clues-list');

        // 如果不存在控制元素，创建它们
        if (this.elements.cluesList && !document.getElementById('clues-controls')) {
            this.createControlElements();
        }
    }

    /**
     * 创建控制元素
     */
    createControlElements() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'clues-controls';
        controlsDiv.className = 'clues-controls';
        controlsDiv.innerHTML = `
            <div class="clues-header">
                <div class="clues-count">
                    <span id="clues-count">0</span> 条线索
                </div>
                <div class="clues-actions">
                    <select id="clues-filter" class="clues-filter">
                        <option value="all">全部线索</option>
                        <option value="high">重要线索</option>
                        <option value="medium">一般线索</option>
                        <option value="low">次要线索</option>
                        <option value="recent">最近发现</option>
                    </select>
                    <select id="clues-sort" class="clues-sort">
                        <option value="importance">按重要性</option>
                        <option value="time">按时间</option>
                        <option value="name">按名称</option>
                        <option value="source">按来源</option>
                    </select>
                </div>
            </div>
            <div class="clues-search">
                <input type="text" id="clues-search" placeholder="搜索线索..." class="clues-search-input">
            </div>
        `;

        // 插入到线索列表前面
        this.elements.cluesList.parentNode.insertBefore(controlsDiv, this.elements.cluesList);

        // 重新缓存元素
        this.elements.cluesFilter = document.getElementById('clues-filter');
        this.elements.cluesSort = document.getElementById('clues-sort');
        this.elements.cluesSearch = document.getElementById('clues-search');
        this.elements.cluesCount = document.getElementById('clues-count');
    }

    /**
     * 创建过滤控制
     */
    createFilterControls() {
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .clues-controls {
                margin-bottom: 1rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
            }
            
            .clues-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .clues-count {
                font-weight: 600;
                color: #2c3e50;
            }
            
            .clues-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .clues-filter, .clues-sort {
                padding: 0.25rem 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .clues-search {
                margin-top: 0.5rem;
            }
            
            .clues-search-input {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .clue-item {
                position: relative;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .clue-item:hover {
                transform: translateX(5px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .clue-item.new {
                animation: clueAppear 0.5s ease-out;
                border-left: 4px solid #2ecc71;
            }
            
            @keyframes clueAppear {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .clue-importance {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            
            .clue-importance.high {
                background: #e74c3c;
            }
            
            .clue-importance.medium {
                background: #f39c12;
            }
            
            .clue-importance.low {
                background: #95a5a6;
            }
            
            .clue-source {
                font-size: 0.8rem;
                color: #7f8c8d;
                margin-top: 0.25rem;
            }
            
            .clue-time {
                font-size: 0.8rem;
                color: #7f8c8d;
                margin-top: 0.25rem;
            }
            
            .clue-connections {
                margin-top: 0.5rem;
                padding-top: 0.5rem;
                border-top: 1px solid #ecf0f1;
            }
            
            .clue-connection {
                display: inline-block;
                background: #3498db;
                color: white;
                padding: 0.2rem 0.5rem;
                border-radius: 12px;
                font-size: 0.7rem;
                margin: 0.1rem;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 过滤器变化
        if (this.elements.cluesFilter) {
            this.elements.cluesFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterAndRenderClues();
            });
        }

        // 排序变化
        if (this.elements.cluesSort) {
            this.elements.cluesSort.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.filterAndRenderClues();
            });
        }

        // 搜索输入
        if (this.elements.cluesSearch) {
            this.elements.cluesSearch.addEventListener('input', (e) => {
                this.searchClues(e.target.value);
            });
        }
    }

    /**
     * 更新线索列表
     * @param {Array} clues - 线索数组
     */
    updateClues(clues) {
        // 标记新线索
        const existingIds = new Set(this.clues.map(c => c.id));
        clues.forEach(clue => {
            if (!existingIds.has(clue.id)) {
                clue.isNew = true;
            }
        });

        this.clues = clues;
        this.filterAndRenderClues();
        this.updateCluesCount();
    }

    /**
     * 添加单个线索
     * @param {Object} clue - 线索对象
     */
    addClue(clue) {
        console.log('🔍 添加线索:', clue.name);

        // 检查是否已存在
        const existingIndex = this.clues.findIndex(c => c.id === clue.id);

        if (existingIndex === -1) {
            clue.isNew = true;
            this.clues.push(clue);

            // 立即更新显示
            this.filterAndRenderClues();
            this.updateCluesCount();

            // 播放发现动画
            this.playDiscoveryAnimation(clue);

            // 强制刷新右侧面板显示
            this.refreshCluesDisplay();

            console.log('✅ 新线索已添加并更新显示:', clue.name);
        } else {
            console.log('⚠️ 线索已存在，跳过添加:', clue.name);
        }
    }

    /**
     * 过滤和渲染线索
     */
    filterAndRenderClues() {
        // 应用过滤器
        this.filteredClues = this.applyFilter(this.clues);

        // 应用排序
        this.filteredClues = this.applySorting(this.filteredClues);

        // 渲染线索
        this.renderClues();
    }

    /**
     * 应用过滤器
     * @param {Array} clues - 线索数组
     * @returns {Array} 过滤后的线索
     */
    applyFilter(clues) {
        switch (this.currentFilter) {
            case 'high':
                return clues.filter(clue => clue.importance === 'high');
            case 'medium':
                return clues.filter(clue => clue.importance === 'medium');
            case 'low':
                return clues.filter(clue => clue.importance === 'low');
            case 'recent':
                const oneHourAgo = Date.now() - (60 * 60 * 1000);
                return clues.filter(clue =>
                    new Date(clue.discoveredAt).getTime() > oneHourAgo
                );
            default:
                return clues;
        }
    }

    /**
     * 应用排序
     * @param {Array} clues - 线索数组
     * @returns {Array} 排序后的线索
     */
    applySorting(clues) {
        const sorted = [...clues];

        switch (this.sortBy) {
            case 'importance':
                const importanceOrder = { high: 3, medium: 2, low: 1 };
                return sorted.sort((a, b) =>
                    (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0)
                );
            case 'time':
                return sorted.sort((a, b) =>
                    new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0)
                );
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'source':
                return sorted.sort((a, b) =>
                    (a.source || '').localeCompare(b.source || '')
                );
            default:
                return sorted;
        }
    }

    /**
     * 搜索线索
     * @param {string} query - 搜索查询
     */
    searchClues(query) {
        if (!query.trim()) {
            this.filterAndRenderClues();
            return;
        }

        const searchTerm = query.toLowerCase();
        this.filteredClues = this.clues.filter(clue =>
            clue.name.toLowerCase().includes(searchTerm) ||
            clue.description.toLowerCase().includes(searchTerm) ||
            (clue.source && clue.source.toLowerCase().includes(searchTerm))
        );

        this.renderClues();
    }

    /**
     * 渲染线索列表
     */
    renderClues() {
        if (!this.elements.cluesList) return;

        if (this.filteredClues.length === 0) {
            this.elements.cluesList.innerHTML = `
                <div class="no-clues">
                    <div class="no-clues-icon">🔍</div>
                    <div class="no-clues-text">
                        ${this.clues.length === 0 ? '暂无发现的线索' : '没有符合条件的线索'}
                    </div>
                </div>
            `;
            return;
        }

        this.elements.cluesList.innerHTML = '';

        this.filteredClues.forEach((clue, index) => {
            const clueElement = this.createClueElement(clue, index);
            this.elements.cluesList.appendChild(clueElement);
        });
    }

    /**
     * 创建线索元素
     * @param {Object} clue - 线索对象
     * @param {number} index - 索引
     * @returns {HTMLElement}
     */
    createClueElement(clue, index) {
        const clueDiv = document.createElement('div');
        clueDiv.className = `clue-item ${clue.isNew ? 'new' : ''}`;
        clueDiv.setAttribute('data-clue-id', clue.id);

        // 重要性指示器
        const importanceDiv = document.createElement('div');
        importanceDiv.className = `clue-importance ${clue.importance || 'low'}`;

        // 标题
        const titleDiv = document.createElement('div');
        titleDiv.className = 'clue-title';
        titleDiv.textContent = clue.name || '未知线索';

        // 描述
        const descDiv = document.createElement('div');
        descDiv.className = 'clue-description';
        descDiv.textContent = clue.description || '暂无描述';

        // 来源信息
        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'clue-source';
        sourceDiv.textContent = clue.source ? `来源: ${clue.source}` : '';

        // 发现时间
        const timeDiv = document.createElement('div');
        timeDiv.className = 'clue-time';
        if (clue.discoveredAt) {
            const time = new Date(clue.discoveredAt);
            timeDiv.textContent = `发现于: ${time.toLocaleString('zh-CN')}`;
        }

        // 关联信息
        const connectionsDiv = document.createElement('div');
        connectionsDiv.className = 'clue-connections';
        if (clue.relatedCharacters && clue.relatedCharacters.length > 0) {
            clue.relatedCharacters.forEach(characterId => {
                const character = this.getCharacterById(characterId);
                if (character) {
                    const connectionSpan = document.createElement('span');
                    connectionSpan.className = 'clue-connection';
                    connectionSpan.textContent = character.name;
                    connectionsDiv.appendChild(connectionSpan);
                }
            });
        }

        // 线索图片（如果有）
        if (clue.imageUrl) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'clue-image';

            const img = document.createElement('img');
            img.src = clue.imageUrl;
            img.alt = `${clue.name}的图片`;
            img.className = 'clue-img';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '6px';
            img.style.marginTop = '0.5rem';
            img.onerror = function() {
                this.style.display = 'none';
            };

            imageDiv.appendChild(img);
        }

        // 组装元素
        clueDiv.appendChild(importanceDiv);
        clueDiv.appendChild(titleDiv);
        clueDiv.appendChild(descDiv);
        if (sourceDiv.textContent) clueDiv.appendChild(sourceDiv);
        if (timeDiv.textContent) clueDiv.appendChild(timeDiv);
        if (connectionsDiv.children.length > 0) clueDiv.appendChild(connectionsDiv);
        if (clue.imageUrl) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'clue-image';

            const img = document.createElement('img');
            img.src = clue.imageUrl;
            img.alt = `${clue.name}的图片`;
            img.className = 'clue-img';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '6px';
            img.style.marginTop = '0.5rem';
            img.onerror = function() {
                this.style.display = 'none';
            };

            imageDiv.appendChild(img);
            clueDiv.appendChild(imageDiv);
        }

        // 绑定点击事件
        clueDiv.addEventListener('click', () => this.handleClueClick(clue));

        // 移除新线索标记
        setTimeout(() => {
            clue.isNew = false;
            clueDiv.classList.remove('new');
        }, 3000);

        return clueDiv;
    }

    /**
     * 处理线索点击
     * @param {Object} clue - 线索对象
     */
    handleClueClick(clue) {
        // 显示线索详情模态框
        this.showClueDetails(clue);

        // 触发线索选择事件
        if (window.gameController) {
            window.gameController.emit('clueSelected', clue);
        }
    }

    /**
     * 显示线索详情
     * @param {Object} clue - 线索对象
     */
    showClueDetails(clue) {
        const modalContent = `
            <div class="clue-details">
                <div class="clue-details-header">
                    <h4>${clue.name}</h4>
                    <span class="tag importance-${clue.importance || 'low'}">
                        ${this.getImportanceText(clue.importance)}
                    </span>
                </div>
                
                <div class="clue-details-body">
                    <p><strong>描述:</strong> ${clue.description}</p>
                    
                    ${clue.location ? `<p><strong>发现地点:</strong> ${clue.location}</p>` : ''}
                    
                    ${clue.source ? `<p><strong>信息来源:</strong> ${clue.source}</p>` : ''}
                    
                    ${clue.discoveredAt ? `<p><strong>发现时间:</strong> ${new Date(clue.discoveredAt).toLocaleString('zh-CN')}</p>` : ''}
                    
                    ${clue.relatedCharacters && clue.relatedCharacters.length > 0 ? 
                        `<p><strong>相关人物:</strong> ${clue.relatedCharacters.map(id => this.getCharacterById(id)?.name || id).join(', ')}</p>` : ''}
                </div>
                
                ${clue.imageUrl ? `
                    <div class="clue-details-image">
                        <img src="${clue.imageUrl}" alt="${clue.name}" style="max-width: 100%; border-radius: 8px;">
                    </div>
                ` : ''}
            </div>
        `;

        if (window.uiController) {
            const modal = window.uiController.createModal(
                '线索详情',
                modalContent,
                [
                    {
                        text: '关闭',
                        class: 'primary-btn',
                        click: () => window.uiController.closeModal()
                    }
                ]
            );
            window.uiController.showModal(modal);
        }
    }

    /**
     * 获取重要性文本
     * @param {string} importance - 重要性级别
     * @returns {string}
     */
    getImportanceText(importance) {
        const importanceMap = {
            high: '重要',
            medium: '一般',
            low: '次要'
        };
        return importanceMap[importance] || '未知';
    }

    /**
     * 根据ID获取角色
     * @param {string} characterId - 角色ID
     * @returns {Object|null}
     */
    getCharacterById(characterId) {
        // 安全地获取游戏控制器
        const gameController = window.gameController;
        if (!gameController || !gameController.currentGame) {
            return {
                id: characterId,
                name: `角色${characterId}`,
                role: 'unknown'
            };
        }

        const character = gameController.currentGame.script.characters.find(c => c.id === characterId);
        return character || {
            id: characterId,
            name: `未知角色(${characterId})`,
            role: 'unknown'
        };
    }

    /**
     * 更新线索计数
     */
    updateCluesCount() {
        if (this.elements.cluesCount) {
            this.elements.cluesCount.textContent = this.clues.length;
        }
    }

    /**
     * 播放发现动画
     * @param {Object} clue - 新发现的线索
     */
    playDiscoveryAnimation(clue) {
        // 创建飞入动画效果
        const notification = document.createElement('div');
        notification.className = 'clue-discovery-notification';
        notification.innerHTML = `
            <div class="discovery-icon">🔍</div>
            <div class="discovery-text">
                <strong>发现新线索！</strong><br>
                ${clue.name}
            </div>
        `;

        document.body.appendChild(notification);

        // 动画样式
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: linear-gradient(135deg, #2ecc71, #27ae60);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(46, 204, 113, 0.3);
            z-index: 10000;
            text-align: center;
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;

        // 播放动画
        setTimeout(() => {
            notification.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);

        // 移除动画
        setTimeout(() => {
            notification.style.transform = 'translate(-50%, -50%) scale(0)';
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }

    /**
     * 强制刷新线索显示
     */
    refreshCluesDisplay() {
        console.log('🔧 强制刷新线索显示');

        // 确保DOM元素存在
        if (!this.elements.cluesList) {
            this.cacheElements();
        }

        // 强制重新渲染
        setTimeout(() => {
            this.filterAndRenderClues();
            this.updateCluesCount();
        }, 100);

        // 通知其他组件更新
        if (window.uiController && window.uiController.updateCluesList) {
            window.uiController.updateCluesList(this.clues);
        }

        // 发送自定义事件通知其他组件
        document.dispatchEvent(new CustomEvent('cluesUpdated', {
            detail: {
                clues: this.clues,
                count: this.clues.length
            }
        }));
    }

    /**
     * 清空所有线索
     */
    clearClues() {
        this.clues = [];
        this.filteredClues = [];
        this.renderClues();
        this.updateCluesCount();
    }

    /**
     * 获取线索统计信息
     * @returns {Object}
     */
    getClueStats() {
        const stats = {
            total: this.clues.length,
            byImportance: {
                high: this.clues.filter(c => c.importance === 'high').length,
                medium: this.clues.filter(c => c.importance === 'medium').length,
                low: this.clues.filter(c => c.importance === 'low').length
            },
            recent: this.clues.filter(c => {
                const oneHourAgo = Date.now() - (60 * 60 * 1000);
                return new Date(c.discoveredAt).getTime() > oneHourAgo;
            }).length
        };

        return stats;
    }
}

// 创建全局实例
window.clueManager = new ClueManager();
