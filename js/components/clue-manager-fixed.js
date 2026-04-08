/**
 * 线索管理组件 - 修复版本
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

        // 搜索
        if (this.elements.cluesSearch) {
            this.elements.cluesSearch.addEventListener('input', (e) => {
                this.searchClues(e.target.value);
            });
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
            <div class="clues-filters">
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
                <span class="clues-count-display">线索数量: <span id="clues-count">0</span></span>
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
     * 创建过滤控件
     */
    createFilterControls() {
        // 如果已经创建了控制元素，重新绑定事件
        if (this.elements.cluesFilter) {
            this.bindEvents();
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
     * 添加单个线索 - 修复版本
     * @param {Object} clue - 线索对象
     */
    addClue(clue) {
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
            
            // 触发UI更新事件
            this.triggerUIUpdate();
            
            console.log('✅ 新线索已添加并更新显示:', clue.name);
        } else {
            console.log('⚠️ 线索已存在，跳过添加:', clue.name);
        }
    }

    /**
     * 强制刷新线索显示
     */
    refreshCluesDisplay() {
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
    }

    /**
     * 触发UI更新事件
     */
    triggerUIUpdate() {
        // 发送自定义事件通知其他组件
        document.dispatchEvent(new CustomEvent('cluesUpdated', {
            detail: {
                clues: this.clues,
                count: this.clues.length
            }
        }));
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
    }}
