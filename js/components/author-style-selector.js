/**
 * 作家风格选择组件
 * 提供作家风格选择和推荐功能
 */

class AuthorStyleSelector {
    constructor() {
        this.selectedAuthor = null;
        this.recommendedAuthors = [];
        this.allAuthors = [];
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * 初始化组件
     */
    async init() {
        try {
            await this.loadAuthors();
            this.createUI();
            this.bindEvents();
            this.isInitialized = true;
            console.log('✅ 作家风格选择器初始化成功');
        } catch (error) {
            console.error('❌ 作家风格选择器初始化失败:', error);
            this.showError('作家风格选择器初始化失败，请刷新页面重试');
        }
    }

    /**
     * 加载作家风格数据
     */
    async loadAuthors() {
        try {
            const data = await authorStyleAPI.getAuthorStyles({ limit: 50 });
            this.allAuthors = data.authors || [];
            
            // 如果没有数据，尝试初始化
            if (this.allAuthors.length === 0) {
                await this.initializeDefaultAuthors();
            }
        } catch (error) {
            console.error('加载作家风格数据失败:', error);
            // 尝试初始化默认数据
            await this.initializeDefaultAuthors();
        }
    }

    /**
     * 初始化默认作家数据
     */
    async initializeDefaultAuthors() {
        try {
            // 加载默认作家数据
            const response = await fetch('/data/author-styles.json');
            const defaultAuthors = await response.json();
            
            // 批量初始化
            await authorStyleAPI.batchInitAuthors(defaultAuthors);
            
            // 重新加载数据
            const data = await authorStyleAPI.getAuthorStyles({ limit: 50 });
            this.allAuthors = data.authors || [];
            
            console.log('✅ 默认作家数据初始化成功');
        } catch (error) {
            console.error('❌ 初始化默认作家数据失败:', error);
        }
    }

    /**
     * 创建UI界面
     */
    createUI() {
        const container = document.getElementById('author-style-container');
        if (!container) {
            console.warn('未找到作家风格容器元素');
            return;
        }

        container.innerHTML = `
            <div class="author-style-selector">
                <div class="selector-header">
                    <div class="header-content">
                        <h3>选择作家风格</h3>
                        <p class="selector-description">选择一位作家的写作风格来生成具有特色的剧本（可选功能）</p>
                        <div class="current-selection" id="current-selection" style="display: none;">
                            <span class="selection-label">当前选择：</span>
                            <span class="selection-value" id="selection-value"></span>
                        </div>
                    </div>
                    <button id="toggle-author-selector" class="btn btn-outline toggle-btn">
                        <span class="toggle-text">展开选择</span>
                        <span class="toggle-icon">▼</span>
                    </button>
                </div>
                
                <div class="author-selector-content" id="author-selector-content" style="display: none;">
                    <div class="style-search">
                        <input type="text" id="style-search-input" placeholder="搜索作家或风格特征..." />
                        <button id="style-search-btn" class="btn btn-secondary">搜索</button>
                    </div>

                    <div class="style-filters">
                        <select id="genre-filter">
                            <option value="">所有流派</option>
                        </select>
                        <select id="era-filter">
                            <option value="">所有时代</option>
                        </select>
                        <button id="recommend-btn" class="btn btn-primary">智能推荐</button>
                    </div>
                
                    <div class="recommended-styles" id="recommended-styles" style="display: none;">
                        <h4>推荐风格</h4>
                        <div class="author-grid" id="recommended-grid"></div>
                    </div>

                    <div class="all-styles">
                        <h4>所有作家风格</h4>
                        <div class="author-grid" id="author-grid"></div>
                    </div>
                </div>

                <div class="selected-style" id="selected-style" style="display: none;">
                    <h4>已选择的风格</h4>
                    <div class="selected-author-info"></div>
                    <div class="selected-actions">
                        <button id="apply-style-btn" class="btn btn-success">应用此风格</button>
                        <button id="clear-style-btn" class="btn btn-outline">清除选择</button>
                    </div>
                </div>
            </div>
        `;

        this.populateFilters();
        this.renderAuthors(this.allAuthors);
    }

    /**
     * 填充筛选器选项
     */
    populateFilters() {
        const genreFilter = document.getElementById('genre-filter');
        const eraFilter = document.getElementById('era-filter');
        
        // 填充流派选项
        const genres = authorStyleAPI.getAvailableGenres();
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
        
        // 填充时代选项
        const eras = authorStyleAPI.getAvailableEras();
        eras.forEach(era => {
            const option = document.createElement('option');
            option.value = era;
            option.textContent = era;
            eraFilter.appendChild(option);
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索功能
        const searchBtn = document.getElementById('style-search-btn');
        const searchInput = document.getElementById('style-search-input');
        
        searchBtn?.addEventListener('click', () => this.handleSearch());
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // 筛选功能
        document.getElementById('genre-filter')?.addEventListener('change', () => this.handleFilter());
        document.getElementById('era-filter')?.addEventListener('change', () => this.handleFilter());
        
        // 智能推荐
        document.getElementById('recommend-btn')?.addEventListener('click', () => this.handleRecommend());

        // 切换显示/隐藏
        document.getElementById('toggle-author-selector')?.addEventListener('click', () => this.toggleSelector());

        // 应用风格
        document.getElementById('apply-style-btn')?.addEventListener('click', () => this.applySelectedStyle());

        // 清除选择
        document.getElementById('clear-style-btn')?.addEventListener('click', () => this.clearSelection());
    }

    /**
     * 渲染作家列表
     */
    renderAuthors(authors, containerId = 'author-grid') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (authors.length === 0) {
            container.innerHTML = '<p class="no-results">暂无匹配的作家风格</p>';
            return;
        }

        container.innerHTML = authors.map(author => {
            const formatted = authorStyleAPI.formatAuthorForDisplay(author);
            return `
                <div class="author-card" data-author-id="${formatted.id}">
                    <div class="author-header">
                        <h5>${formatted.displayName}</h5>
                        <span class="author-era">${formatted.era}</span>
                    </div>
                    <div class="author-info">
                        <p class="author-genres">${formatted.genres}</p>
                        <p class="author-characteristics" title="${formatted.characteristics}">${formatted.characteristics}</p>
                        <p class="author-works"><strong>代表作：</strong>${formatted.representativeWorks}</p>
                        ${formatted.similarity > 0 ? `<p class="similarity">相似度: ${(formatted.similarity * 100).toFixed(1)}%</p>` : ''}
                    </div>
                    <div class="author-actions">
                        <button class="btn btn-outline select-author-btn" data-author-id="${formatted.id}">
                            选择此风格
                        </button>
                        <button class="btn btn-text view-details-btn" data-author-id="${formatted.id}">
                            详情
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定选择事件
        container.querySelectorAll('.select-author-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const authorId = e.target.dataset.authorId;
                this.selectAuthor(authorId);
            });
        });

        // 绑定查看详情事件
        container.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const authorId = e.target.dataset.authorId;
                this.showAuthorDetails(authorId);
            });
        });
    }

    /**
     * 处理搜索
     */
    async handleSearch() {
        const query = document.getElementById('style-search-input')?.value.trim();
        if (!query) {
            this.renderAuthors(this.allAuthors);
            return;
        }

        try {
            const results = await authorStyleAPI.searchSimilarStyles(query, 10);
            this.renderAuthors(results);
        } catch (error) {
            console.error('搜索失败:', error);
            this.showError('搜索失败，请重试');
        }
    }

    /**
     * 处理筛选
     */
    handleFilter() {
        const genre = document.getElementById('genre-filter')?.value;
        const era = document.getElementById('era-filter')?.value;
        
        let filtered = this.allAuthors;
        
        if (genre) {
            filtered = filtered.filter(author => 
                author.style.genre.includes(genre)
            );
        }
        
        if (era) {
            filtered = filtered.filter(author => 
                author.era === era
            );
        }
        
        this.renderAuthors(filtered);
    }

    /**
     * 处理智能推荐
     */
    async handleRecommend() {
        try {
            // 获取当前游戏设置（如果有的话）
            const gameType = this.getCurrentGameType();
            const themes = this.getCurrentThemes();
            
            const recommendations = await authorStyleAPI.recommendStylesForGame(gameType, themes, 5);
            this.recommendedAuthors = recommendations;
            
            // 显示推荐区域
            const recommendedSection = document.getElementById('recommended-styles');
            if (recommendedSection) {
                recommendedSection.style.display = 'block';
                this.renderAuthors(recommendations, 'recommended-grid');
            }
        } catch (error) {
            console.error('获取推荐失败:', error);
            this.showError('获取推荐失败，请重试');
        }
    }

    /**
     * 选择作家
     */
    async selectAuthor(authorId) {
        try {
            const author = await authorStyleAPI.getAuthorStyle(authorId);
            this.selectedAuthor = author;
            
            this.showSelectedAuthor(author);
            this.updateSelectedState(authorId);
        } catch (error) {
            console.error('选择作家失败:', error);
            this.showError('选择作家失败，请重试');
        }
    }

    /**
     * 显示已选择的作家
     */
    showSelectedAuthor(author) {
        const container = document.getElementById('selected-style');
        const currentSelection = document.getElementById('current-selection');
        const selectionValue = document.getElementById('selection-value');

        if (!container) return;

        const formatted = authorStyleAPI.formatAuthorForDisplay(author);

        // 更新头部显示
        if (currentSelection && selectionValue) {
            selectionValue.textContent = formatted.displayName;
            currentSelection.style.display = 'block';
        }

        container.querySelector('.selected-author-info').innerHTML = `
            <div class="selected-author-detail">
                <h5>${formatted.displayName}</h5>
                <p><strong>写作特点：</strong>${formatted.characteristics}</p>
                <p><strong>主要主题：</strong>${formatted.themes}</p>
                <p><strong>适用场景：</strong>${formatted.suitableFor}</p>
            </div>
        `;

        container.style.display = 'block';
    }

    /**
     * 更新选中状态
     */
    updateSelectedState(selectedId) {
        // 移除所有选中状态
        document.querySelectorAll('.author-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 添加选中状态
        document.querySelectorAll(`[data-author-id="${selectedId}"]`).forEach(element => {
            if (element.classList.contains('author-card')) {
                element.classList.add('selected');
            }
        });
    }

    /**
     * 应用选中的风格
     */
    async applySelectedStyle() {
        if (!this.selectedAuthor) {
            this.showError('请先选择一个作家风格');
            return;
        }

        try {
            // 触发自定义事件，通知其他组件
            const event = new CustomEvent('authorStyleSelected', {
                detail: {
                    author: this.selectedAuthor,
                    formatted: authorStyleAPI.formatAuthorForDisplay(this.selectedAuthor)
                }
            });
            
            document.dispatchEvent(event);
            
            // 显示成功消息
            this.showSuccess(`已应用 ${this.selectedAuthor.chineseName} 的写作风格`);
            
        } catch (error) {
            console.error('应用风格失败:', error);
            this.showError('应用风格失败，请重试');
        }
    }

    /**
     * 获取当前游戏类型
     */
    getCurrentGameType() {
        // 这里可以从游戏控制器或其他地方获取当前游戏类型
        return '推理游戏';
    }

    /**
     * 获取当前主题
     */
    getCurrentThemes() {
        // 这里可以从游戏设置中获取主题
        return ['悬疑', '推理', '犯罪'];
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        // 这里可以集成到全局的消息系统
        console.error(message);
        alert(message); // 临时使用alert，后续可以改为更好的UI
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        // 这里可以集成到全局的消息系统
        console.log(message);
        alert(message); // 临时使用alert，后续可以改为更好的UI
    }

    /**
     * 获取选中的作家
     */
    getSelectedAuthor() {
        return this.selectedAuthor;
    }

    /**
     * 切换选择器显示/隐藏
     */
    toggleSelector() {
        const content = document.getElementById('author-selector-content');
        const toggleBtn = document.getElementById('toggle-author-selector');
        const toggleText = toggleBtn?.querySelector('.toggle-text');
        const toggleIcon = toggleBtn?.querySelector('.toggle-icon');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggleText.textContent = '收起选择';
            toggleIcon.textContent = '▲';
        } else {
            content.style.display = 'none';
            toggleText.textContent = '展开选择';
            toggleIcon.textContent = '▼';
        }
    }

    /**
     * 显示作家详情
     */
    async showAuthorDetails(authorId) {
        try {
            const author = await authorStyleAPI.getAuthorStyle(authorId);
            const formatted = authorStyleAPI.formatAuthorForDisplay(author);

            // 创建详情模态框
            const modal = document.createElement('div');
            modal.className = 'author-details-modal';
            modal.innerHTML = `
                <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${formatted.displayName}</h3>
                        <button class="modal-close" onclick="this.closest('.author-details-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="author-detail-section">
                            <h4>基本信息</h4>
                            <p><strong>国籍：</strong>${author.nationality}</p>
                            <p><strong>时代：</strong>${author.era}</p>
                            <p><strong>文学流派：</strong>${author.style.genre.join('、')}</p>
                        </div>

                        <div class="author-detail-section">
                            <h4>写作风格</h4>
                            <p><strong>特点：</strong>${author.style.characteristics}</p>
                            <p><strong>叙述风格：</strong>${author.style.narrativeStyle}</p>
                            <p><strong>语言特色：</strong>${author.style.languageFeatures.join('、')}</p>
                            <p><strong>主要主题：</strong>${author.style.themes.join('、')}</p>
                        </div>

                        <div class="author-detail-section">
                            <h4>情节结构</h4>
                            <p><strong>开头方式：</strong>${author.plotStructure.openingStyle}</p>
                            <p><strong>冲突类型：</strong>${author.plotStructure.conflictTypes.join('、')}</p>
                            <p><strong>结局风格：</strong>${author.plotStructure.endingStyle}</p>
                            <p><strong>节奏控制：</strong>${author.plotStructure.pacing}</p>
                        </div>

                        <div class="author-detail-section">
                            <h4>代表作品</h4>
                            <p>${author.representativeWorks.join('、')}</p>
                        </div>

                        <div class="author-detail-section">
                            <h4>适用场景</h4>
                            <p>${author.suitableFor.join('、')}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="window.authorStyleSelector.selectAuthor('${authorId}'); this.closest('.author-details-modal').remove();">
                            选择此风格
                        </button>
                        <button class="btn btn-outline" onclick="this.closest('.author-details-modal').remove();">
                            关闭
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

        } catch (error) {
            console.error('显示作家详情失败:', error);
            this.showError('获取作家详情失败，请重试');
        }
    }

    /**
     * 清除选择
     */
    clearSelection() {
        this.resetSelection();
        this.showSuccess('已清除作家风格选择');
    }

    /**
     * 重置选择
     */
    resetSelection() {
        this.selectedAuthor = null;

        // 隐藏选择显示
        const selectedStyle = document.getElementById('selected-style');
        const currentSelection = document.getElementById('current-selection');

        if (selectedStyle) selectedStyle.style.display = 'none';
        if (currentSelection) currentSelection.style.display = 'none';

        // 移除所有选中状态
        document.querySelectorAll('.author-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
}

// 创建全局实例
const authorStyleSelector = new AuthorStyleSelector();

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthorStyleSelector;
} else {
    window.AuthorStyleSelector = AuthorStyleSelector;
    window.authorStyleSelector = authorStyleSelector;
}
