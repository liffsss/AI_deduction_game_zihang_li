/**
 * UI控制器
 * 负责用户界面的交互和状态管理
 */

class UIController {
    constructor() {
        this.currentScreen = 'loading';
        this.currentCharacter = null;
        this.isGenerating = false;

        // DOM元素缓存
        this.elements = {};

        // 初始化
        this.init();
    }

    /**
     * 初始化UI控制器
     */
    init() {
        console.log('🎨 UI控制器初始化');

        // 缓存DOM元素
        this.cacheElements();

        // 初始化组件
        this.initializeComponents();

        // 绑定事件监听器
        this.bindEvents();

        // 监听游戏控制器事件
        this.bindGameEvents();

        // 初始化界面
        this.initializeUI();

        // 标记初始化完成
        this.initialized = true;
    }

    /**
     * 初始化组件
     */
    initializeComponents() {
        // 初始化人物关系图
        this.relationshipGraph = new RelationshipGraph('relationship-graph');

        // 设置关系图事件回调
        this.relationshipGraph.onNodeClick = (node) => {
            this.handleCharacterSelect(node);
        };

        this.relationshipGraph.onNodeHover = (node, isEnter) => {
            if (isEnter) {
                this.highlightCharacterCard(node.id);
            } else {
                this.clearCharacterHighlight();
            }
        };

        console.log('✅ 组件初始化完成');
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        // 屏幕元素
        this.elements.loadingScreen = document.getElementById('loading-screen');
        this.elements.setupScreen = document.getElementById('game-setup-screen');
        this.elements.mainScreen = document.getElementById('game-main-screen');
        this.elements.resultScreen = document.getElementById('game-result-screen');

        // 游戏设置元素
        this.elements.gameType = document.getElementById('game-type');
        this.elements.gameStyle = document.getElementById('game-style');
        this.elements.customPrompt = document.getElementById('custom-prompt');
        this.elements.generateBtn = document.getElementById('generate-game-btn');

        // 游戏主界面元素
        this.elements.caseTitle = document.getElementById('case-title');
        this.elements.crimeSceneImage = document.getElementById('crime-scene-image');
        this.elements.caseBackground = document.getElementById('case-background');
        this.elements.characterList = document.getElementById('character-list');
        this.elements.conversationPanel = document.getElementById('conversation-panel');
        this.elements.conversationHistory = document.getElementById('conversation-history');
        this.elements.questionInput = document.getElementById('question-input');
        this.elements.askQuestionBtn = document.getElementById('ask-question-btn');
        this.elements.cluesList = document.getElementById('clues-list');
        this.elements.reasoningNotes = document.getElementById('reasoning-notes');
        this.elements.killerSelect = document.getElementById('killer-select');
        this.elements.submitReasoningBtn = document.getElementById('submit-reasoning-btn');
        this.elements.progressFill = document.querySelector('.progress-fill');

        // 对话相关元素
        this.elements.currentCharacterAvatar = document.getElementById('current-character-avatar');
        this.elements.currentCharacterName = document.getElementById('current-character-name');
        this.elements.currentCharacterRole = document.getElementById('current-character-role');
        this.elements.endConversationBtn = document.getElementById('end-conversation-btn');

        // 结果界面元素
        this.elements.resultTitle = document.getElementById('result-title');
        this.elements.resultContent = document.getElementById('result-content');
        this.elements.newGameBtn = document.getElementById('new-game-btn');
        this.elements.reviewGameBtn = document.getElementById('review-game-btn');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 游戏生成按钮
        this.elements.generateBtn.addEventListener('click', () => this.handleGenerateGame());

        // 提问按钮 - 不绑定事件，完全由对话系统处理
        console.log('🔧 UI控制器跳过按钮事件绑定，由对话系统处理');

        // 输入框回车事件 - 不绑定事件，完全由对话系统处理
        console.log('🔧 UI控制器跳过输入框事件绑定，由对话系统处理');

        // 结束对话按钮
        this.elements.endConversationBtn.addEventListener('click', () => this.endConversation());

        // 提交推理按钮
        this.elements.submitReasoningBtn.addEventListener('click', () => this.handleSubmitReasoning());

        // 新游戏按钮
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());

        // 回顾游戏按钮
        this.elements.reviewGameBtn.addEventListener('click', () => this.reviewGame());
    }

    /**
     * 绑定游戏控制器事件
     */
    bindGameEvents() {
        gameController.on('gameStateChanged', (data) => this.handleGameStateChanged(data));
        gameController.on('gameGenerated', (game) => this.handleGameGenerated(game));
        gameController.on('conversationAdded', (conversation) => this.handleConversationAdded(conversation));
        gameController.on('clueDiscovered', (clue) => this.handleClueDiscovered(clue));
        gameController.on('suspicionChanged', (data) => this.handleSuspicionChanged(data));
        gameController.on('reasoningSubmitted', (data) => this.handleReasoningSubmitted(data));
        gameController.on('gameCompleted', (game) => this.handleGameCompleted(game));
        gameController.on('gameLoaded', (game) => this.handleGameLoaded(game));
        gameController.on('characterDiscovered', (data) => this.handleCharacterDiscovered(data));

        // 监听DOM角色发现事件（来自对话系统）
        document.addEventListener('characterDiscovered', (event) => {
            this.handleCharacterDiscovered(event.detail);
        });
    }

    /**
     * 初始化界面
     */
    async initializeUI() {
        // 显示加载界面
        const delay = (window.CONFIG?.UI?.loadingMinDuration) || 1000;
        const utils = window.Utils || { delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)) };
        await utils.delay(delay);

        // 检查是否有保存的游戏
        if (gameController.currentGame) {
            this.showMainScreen();
            this.updateGameUI(gameController.currentGame);
        } else {
            this.showSetupScreen();
        }
    }

    /**
     * 显示设置界面
     */
    showSetupScreen() {
        this.switchScreen('setup');
        this.currentScreen = 'setup';
    }

    /**
     * 显示主游戏界面
     */
    showMainScreen() {
        this.switchScreen('main');
        this.currentScreen = 'main';
    }

    /**
     * 显示结果界面
     */
    showResultScreen() {
        this.switchScreen('result');
        this.currentScreen = 'result';
    }

    /**
     * 切换屏幕
     * @param {string} screenName - 屏幕名称
     */
    switchScreen(screenName) {
        // 隐藏所有屏幕
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // 显示目标屏幕
        const targetScreen = document.getElementById(`${screenName === 'setup' ? 'game-setup' : 
                                                   screenName === 'main' ? 'game-main' : 
                                                   screenName === 'result' ? 'game-result' : 'loading'}-screen`);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }

    /**
     * 处理游戏生成
     */
    async handleGenerateGame() {
        if (this.isGenerating) return;

        try {
            this.isGenerating = true;
            this.updateGenerateButton(true);

            // 获取配置
            const gameConfig = {
                gameType: this.elements.gameType.value,
                gameStyle: this.elements.gameStyle.value,
                customPrompt: this.elements.customPrompt.value.trim()
            };

            // 验证输入
            if (!gameConfig.customPrompt) {
                this.showNotification('请输入游戏描述', 'warning');
                return;
            }

            // 获取选中的作家风格
            const selectedAuthor = window.authorStyleSelector ? window.authorStyleSelector.getSelectedAuthor() : null;

            // API密钥现在自动从环境变量加载，无需检查

            // 生成游戏
            await gameController.startNewGame(gameConfig, selectedAuthor);

        } catch (error) {
            console.error('游戏生成失败:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.isGenerating = false;
            this.updateGenerateButton(false);
        }
    }

    /**
     * 检查API密钥 (已废弃 - 现在从环境变量自动加载)
     */
    checkAPIKeys() {
        // API密钥现在从环境变量自动加载，总是返回true
        return true;
    }

    /**
     * 显示API密钥配置模态框
     * @param {string} apiType - API类型
     */
    showAPIKeyModal(apiType) {
        const modal = this.createModal(
            `配置${apiType === 'deepseek' ? 'DeepSeek' : '通义万相'}API密钥`,
            `
            <div class="form-group">
                <label>API密钥:</label>
                <input type="password" id="api-key-input" placeholder="请输入API密钥">
                <small>密钥将保存在本地浏览器中</small>
            </div>
            `,
            [
                {
                    text: '取消',
                    class: 'secondary-btn',
                    click: () => this.closeModal()
                },
                {
                    text: '保存',
                    class: 'primary-btn',
                    click: () => this.saveAPIKey(apiType)
                }
            ]
        );

        this.showModal(modal);
    }

    /**
     * 保存API密钥
     * @param {string} apiType - API类型
     */
    saveAPIKey(apiType) {
        const input = document.getElementById('api-key-input');
        const apiKey = input.value.trim();

        if (!apiKey) {
            this.showNotification('请输入API密钥', 'warning');
            return;
        }

        if (apiType === 'deepseek') {
            deepseekAPI.setApiKey(apiKey);
        } else if (apiType === 'tongyi') {
            tongYiAPI.setApiKey(apiKey);
        }

        this.closeModal();
        this.showNotification('API密钥保存成功', 'success');
    }

    /**
     * 处理角色选择
     * @param {Object} character - 角色信息
     */
    selectCharacter(character) {
        this.handleCharacterSelect(character);
    }

    /**
     * 处理角色选择的核心逻辑
     * @param {Object} character - 角色信息
     */
    handleCharacterSelect(character) {
        console.log('🔧 UI控制器选择角色:', character.name);
        this.currentCharacter = character;

        // 更新角色选择状态
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });

        const selectedCard = document.querySelector(`[data-character-id="${character.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // 高亮关系图中的节点
        if (this.relationshipGraph) {
            this.relationshipGraph.clearHighlight();
            this.relationshipGraph.highlightRelatedNodes(character);
        }

        // 同步角色状态到对话系统
        if (window.dialogueSystem) {
            console.log('🔧 同步角色状态到对话系统');
            window.dialogueSystem.currentCharacter = character;
            window.dialogueSystem.startConversation(character);
        } else {
            // 降级到原有方法
            this.showConversationPanel(character);
        }

        console.log('✅ 角色选择完成，当前角色:', character.name);
    }

    /**
     * 显示对话面板
     * @param {Object} character - 角色信息
     */
    showConversationPanel(character) {
        this.elements.conversationPanel.classList.remove('hidden');

        // 更新角色信息
        this.elements.currentCharacterAvatar.src = this.getCharacterAvatarUrl(character);
        this.elements.currentCharacterName.textContent = character.name;
        this.elements.currentCharacterRole.textContent = character.role;

        // 清空输入框
        this.elements.questionInput.value = '';
        this.elements.questionInput.focus();

        // 加载对话历史
        this.loadConversationHistory(character.id);
    }

    /**
     * 处理提问
     */
    async handleAskQuestion() {
        if (!this.currentCharacter) {
            this.showNotification('请先选择要对话的角色', 'warning');
            return;
        }

        const question = this.elements.questionInput.value.trim();
        if (!question) {
            this.showNotification('请输入问题', 'warning');
            return;
        }

        try {
            // 禁用输入
            this.setConversationInputState(false);

            // 添加用户消息到界面
            this.addMessageToHistory('user', question);

            // 清空输入框
            this.elements.questionInput.value = '';

            // 调用游戏控制器
            const result = await gameController.talkToCharacter(this.currentCharacter.id, question);

            // 添加角色回应到界面
            this.addMessageToHistory('character', result.conversation.response, this.currentCharacter);

            // 处理新线索
            if (result.newClues && result.newClues.length > 0) {
                this.showNotification(`发现${result.newClues.length}条新线索！`, 'success');
            }

        } catch (error) {
            console.error('对话失败:', error);
            this.showNotification(error.message, 'error');
        } finally {
            // 恢复输入
            this.setConversationInputState(true);
            this.elements.questionInput.focus();
        }
    }

    /**
     * 添加消息到对话历史
     * @param {string} type - 消息类型 (user/character)
     * @param {string} content - 消息内容
     * @param {Object} character - 角色信息 (仅角色消息需要)
     */
    addMessageToHistory(type, content, character = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const avatarImg = document.createElement('img');
        avatarImg.className = 'message-avatar';
        avatarImg.src = type === 'user' ? '/assets/user-avatar.png' : this.getCharacterAvatarUrl(character);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        const utils = window.Utils || { formatTime: (timestamp) => new Date(timestamp).toLocaleTimeString('zh-CN') };
        timeDiv.textContent = utils.formatTime(Date.now());

        messageDiv.appendChild(avatarImg);
        messageDiv.appendChild(contentDiv);
        contentDiv.appendChild(timeDiv);

        this.elements.conversationHistory.appendChild(messageDiv);

        // 滚动到底部
        this.elements.conversationHistory.scrollTop = this.elements.conversationHistory.scrollHeight;
    }

    /**
     * 处理推理提交
     */
    async handleSubmitReasoning() {
        const reasoning = this.elements.reasoningNotes.value.trim();
        const killer = this.elements.killerSelect.value;

        if (!reasoning) {
            this.showNotification('请输入推理过程', 'warning');
            return;
        }

        if (!killer) {
            this.showNotification('请选择凶手', 'warning');
            return;
        }

        try {
            this.elements.submitReasoningBtn.disabled = true;
            this.elements.submitReasoningBtn.textContent = '提交中...';

            console.log('🧠 提交推理数据:', {
                reasoning: reasoning,
                killer: killer,
                submittedAt: new Date().toISOString()
            });

            await gameController.submitReasoning({
                reasoning: reasoning,
                killer: killer,
                submittedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error('推理提交失败:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.elements.submitReasoningBtn.disabled = false;
            this.elements.submitReasoningBtn.textContent = '提交推理';
        }
    }

    /**
     * 更新游戏UI
     * @param {Object} game - 游戏数据
     */
    updateGameUI(game) {
        // 更新案件信息
        this.elements.caseTitle.textContent = game.script.title;
        this.elements.caseBackground.textContent = game.script.background;

        // 更新案发现场图片
        if (game.images.crimeScene) {
            this.elements.crimeSceneImage.src = tongYiAPI.getProxyImageUrl(game.images.crimeScene.imageUrl);
        }

        // 获取当前可用角色（只调用一次）
        const availableCharacters = gameController.getAvailableCharacters();

        // 更新角色列表
        this.updateCharacterList(availableCharacters, game.images.characters);

        // 更新人物关系图
        if (this.relationshipGraph) {
            this.relationshipGraph.updateData(availableCharacters, game.gameProgress.suspicionLevels);
        }

        // 更新线索列表
        if (window.clueManager) {
            window.clueManager.updateClues(game.gameProgress.discoveredClues);
        } else {
            this.updateCluesList(game.gameProgress.discoveredClues);
        }

        // 更新凶手选择下拉框
        this.updateKillerSelect(availableCharacters);

        // 更新进度条
        this.updateProgress(game);
    }

    /**
     * 更新角色列表
     * @param {Array} characters - 角色列表
     * @param {Object} characterImages - 角色图片
     */
    updateCharacterList(characters, characterImages = {}) {
        this.elements.characterList.innerHTML = '';

        characters.forEach(character => {
            const characterCard = document.createElement('div');
            characterCard.className = 'character-card';
            characterCard.setAttribute('data-character-id', character.id);

            const avatarImg = document.createElement('img');
            avatarImg.className = 'character-avatar';
            avatarImg.src = characterImages[character.id] ?
                tongYiAPI.getProxyImageUrl(characterImages[character.id].imageUrl) :
                '/assets/default-avatar.png';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'character-name';
            nameDiv.textContent = character.name;

            const roleDiv = document.createElement('div');
            roleDiv.className = 'character-role';
            roleDiv.textContent = character.role;

            // 怀疑度指示器
            const suspicionDiv = document.createElement('div');
            suspicionDiv.className = 'suspicion-meter';
            const suspicionFill = document.createElement('div');
            suspicionFill.className = 'suspicion-fill';
            suspicionFill.style.width = `${character.suspicionLevel || 0}%`;
            suspicionDiv.appendChild(suspicionFill);

            characterCard.appendChild(avatarImg);
            characterCard.appendChild(nameDiv);
            characterCard.appendChild(roleDiv);
            characterCard.appendChild(suspicionDiv);

            // 点击事件
            characterCard.addEventListener('click', () => this.selectCharacter(character));

            this.elements.characterList.appendChild(characterCard);
        });
    }

    /**
     * 更新线索列表
     * @param {Array} clues - 线索列表
     */
    updateCluesList(clues) {
        this.elements.cluesList.innerHTML = '';

        if (clues.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'text-center';
            emptyDiv.textContent = '暂无发现的线索';
            this.elements.cluesList.appendChild(emptyDiv);
            return;
        }

        clues.forEach(clue => {
            const clueItem = document.createElement('div');
            clueItem.className = 'clue-item';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'clue-title';
            titleDiv.textContent = clue.name;

            const descDiv = document.createElement('div');
            descDiv.className = 'clue-description';
            descDiv.textContent = clue.description;

            // 重要性标签
            if (clue.importance) {
                const tag = document.createElement('span');
                tag.className = `tag importance-${clue.importance}`;
                tag.textContent = clue.importance === 'high' ? '重要' :
                                 clue.importance === 'medium' ? '一般' : '次要';
                titleDiv.appendChild(tag);
            }

            clueItem.appendChild(titleDiv);
            clueItem.appendChild(descDiv);

            this.elements.cluesList.appendChild(clueItem);
        });
    }

    /**
     * 更新凶手选择下拉框
     * @param {Array} characters - 角色列表
     */
    updateKillerSelect(characters) {
        this.elements.killerSelect.innerHTML = '<option value="">请选择...</option>';

        // 只显示嫌疑人作为凶手选项
        const suspects = characters.filter(character => character.role === 'suspect');

        if (suspects.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '暂无嫌疑人（通过对话发现更多角色）';
            option.disabled = true;
            this.elements.killerSelect.appendChild(option);
            return;
        }

        suspects.forEach(character => {
            const option = document.createElement('option');
            // 使用角色名称作为值，确保与验证时的数据一致
            option.value = character.name;
            option.textContent = character.name;
            // 存储ID作为数据属性，以备需要
            option.setAttribute('data-character-id', character.id);
            this.elements.killerSelect.appendChild(option);
        });

        console.log(`🎯 更新凶手选择列表: ${suspects.length}个嫌疑人`);
    }

    /**
     * 更新进度条
     * @param {Object} game - 游戏数据
     */
    updateProgress(game) {
        const totalClues = game.script.clues.length;
        const foundClues = game.gameProgress.discoveredClues.length;
        const progress = Math.round((foundClues / totalClues) * 100);

        this.elements.progressFill.style.width = `${progress}%`;
    }

    /**
     * 获取角色头像URL
     * @param {Object} character - 角色信息
     * @returns {string}
     */
    getCharacterAvatarUrl(character) {
        if (!character) return '/assets/default-avatar.png';

        const game = gameController.currentGame;
        if (game && game.images.characters[character.id]) {
            return tongYiAPI.getProxyImageUrl(game.images.characters[character.id].imageUrl);
        }

        return '/assets/default-avatar.png';
    }

    /**
     * 显示通知
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 自动移除
        setTimeout(() => {
            notification.remove();
        }, (window.CONFIG?.UI?.notificationDuration) || 3000);
    }

    /**
     * 创建模态框
     * @param {string} title - 标题
     * @param {string} content - 内容
     * @param {Array} buttons - 按钮配置
     * @returns {HTMLElement}
     */
    createModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const header = document.createElement('div');
        header.className = 'modal-header';

        const titleElement = document.createElement('h3');
        titleElement.className = 'modal-title';
        titleElement.textContent = title;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.closeModal();

        header.appendChild(titleElement);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = content;

        modalContent.appendChild(header);
        modalContent.appendChild(body);

        if (buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';

            buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = btn.class || 'primary-btn';
                button.textContent = btn.text;
                button.onclick = btn.click;
                footer.appendChild(button);
            });

            modalContent.appendChild(footer);
        }

        modal.appendChild(modalContent);
        return modal;
    }

    /**
     * 显示模态框
     * @param {HTMLElement} modal - 模态框元素
     */
    showModal(modal) {
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.querySelector('.modal.show');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // 游戏事件处理器
    handleGameStateChanged(data) {
        console.log('游戏状态变化:', data);

        if (data.state === 'generating') {
            this.showNotification(data.message, 'info');

            // 处理进度条显示
            if (data.showProgress || data.progress) {
                this.updateGenerationProgress(data);
            }
        } else if (data.state === 'error') {
            this.showNotification(data.message, 'error');
            this.hideGenerationProgress();
        } else if (data.state === 'playing') {
            if (data.progress && data.progress.hideProgress) {
                setTimeout(() => this.hideGenerationProgress(), 2000);
            }
        }
    }

    handleGameGenerated(game) {
        console.log('游戏生成完成:', game);
        this.showMainScreen();
        this.updateGameUI(game);

        // 初始化角色列表（只显示初始可用的角色）
        this.updateAvailableCharacters();

        // 确保关系图也只显示初始可用角色
        if (this.relationshipGraph) {
            const availableCharacters = gameController.getAvailableCharacters();
            this.relationshipGraph.updateData(availableCharacters, game.gameProgress.suspicionLevels);
        }

        this.showNotification('游戏生成成功！开始你的推理之旅吧！', 'success');

        // 显示游戏提示
        const availableCount = gameController.getAvailableCharacters().length;
        const totalCount = game.script.characters.length;
        if (totalCount > availableCount) {
            setTimeout(() => {
                this.showNotification(
                    `💡 提示：通过与角色对话可能会发现更多相关人员（当前可对话：${availableCount}/${totalCount}）`,
                    'info'
                );
            }, 3000);
        }
    }

    // 更新生成进度
    updateGenerationProgress(data) {
        const progressContainer = document.getElementById('generation-progress');

        // 显示进度条
        if (data.showProgress && progressContainer) {
            progressContainer.classList.remove('hidden');
        }

        if (data.progress && progressContainer) {
            const { percentage, step, status, nextStep } = data.progress;

            // 更新进度条
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            const progressPercentage = document.getElementById('progress-percentage');

            if (progressFill) progressFill.style.width = `${percentage}%`;
            if (progressText) progressText.textContent = data.message;
            if (progressPercentage) progressPercentage.textContent = `${percentage}%`;

            // 更新步骤状态
            this.updateStepStatus(step, status);
            if (nextStep) {
                this.updateStepStatus(nextStep, 'active');
            }
        }
    }

    // 更新步骤状态
    updateStepStatus(step, status) {
        const stepElement = document.getElementById(`step-${step}`);
        if (!stepElement) return;

        // 移除所有状态类
        stepElement.classList.remove('active', 'completed');

        // 添加新状态类
        if (status === 'active' || status === 'completed') {
            stepElement.classList.add(status);
        }

        // 更新状态文本
        const statusElement = stepElement.querySelector('.step-status');
        if (statusElement) {
            statusElement.className = `step-status ${status}`;
            statusElement.textContent = status === 'active' ? '进行中' :
                                      status === 'completed' ? '已完成' : '等待中';
        }
    }

    // 隐藏生成进度
    hideGenerationProgress() {
        const progressContainer = document.getElementById('generation-progress');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }
    }

    handleConversationAdded(conversation) {
        console.log('新对话添加:', conversation);
        // 对话已在handleAskQuestion中处理
    }

    handleClueDiscovered(clue) {
        console.log('发现新线索:', clue);

        // 使用线索管理器更新线索
        if (window.clueManager) {
            window.clueManager.addClue(clue);
        } else {
            this.updateCluesList(gameController.currentGame.gameProgress.discoveredClues);
        }

        this.updateProgress(gameController.currentGame);
    }

    handleCharacterDiscovered(data) {
        console.log('🔍 UI控制器处理角色发现:', data);

        // 更新角色列表显示
        console.log('🔧 更新角色列表显示...');
        this.updateAvailableCharacters();

        // 更新关系图
        if (this.relationshipGraph && gameController.currentGame) {
            console.log('🔧 更新关系图...');
            const suspicionLevels = gameController.currentGame.gameProgress.suspicionLevels;
            this.relationshipGraph.addCharacter(data.character, suspicionLevels);
        }

        // 更新凶手选择列表（如果新角色是嫌疑人）
        if (data.character.role === 'suspect') {
            console.log('🔧 更新凶手选择列表...');
            const availableCharacters = gameController.getAvailableCharacters();
            this.updateKillerSelect(availableCharacters);
        }

        // 显示通知
        this.showNotification(`发现新角色: ${data.character.name}`, 'info');
        console.log('✅ 角色发现处理完成');
    }

    handleSuspicionChanged(data) {
        console.log('怀疑度变化:', data);

        // 更新角色卡片的怀疑度指示器
        const characterCard = document.querySelector(`[data-character-id="${data.characterId}"]`);
        if (characterCard) {
            const suspicionFill = characterCard.querySelector('.suspicion-fill');
            if (suspicionFill) {
                suspicionFill.style.width = `${data.newLevel}%`;
            }
        }

        // 更新关系图中的怀疑度
        if (this.relationshipGraph) {
            this.relationshipGraph.updateSuspicion(data.characterId, data.newLevel);
        }
    }

    handleReasoningSubmitted(data) {
        console.log('推理提交完成:', data);
        this.showResultScreen();
        this.displayGameResult(data);
    }

    /**
     * 更新可用角色列表
     */
    updateAvailableCharacters() {
        if (!gameController.currentGame) return;

        const availableCharacters = gameController.getAvailableCharacters();
        const charactersContainer = document.getElementById('character-list');

        if (!charactersContainer) {
            console.error('❌ 角色列表容器未找到');
            return;
        }

        // 清空现有角色列表
        charactersContainer.innerHTML = '';

        // 渲染可用角色
        availableCharacters.forEach(character => {
            const characterCard = this.createCharacterCard(character);
            charactersContainer.appendChild(characterCard);
        });

        console.log(`✅ 更新角色列表，当前可用角色: ${availableCharacters.length}个`);
    }

    /**
     * 创建角色卡片
     * @param {Object} character - 角色信息
     * @returns {HTMLElement}
     */
    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;

        const suspicionLevel = gameController.currentGame.gameProgress.suspicionLevels[character.id] || 0;
        const isNewlyDiscovered = gameController.currentGame.gameProgress.discoveredCharacters
            .some(dc => dc.characterId === character.id);

        card.innerHTML = `
            <div class="character-avatar">
                <img src="${character.avatar || '/images/default-avatar.png'}" alt="${character.name}">
                ${isNewlyDiscovered ? '<div class="new-character-badge">新</div>' : ''}
            </div>
            <div class="character-info">
                <h4 class="character-name">${character.name}</h4>
                <p class="character-role">${character.role}</p>
                <p class="character-description">${character.background}</p>
                <div class="suspicion-meter">
                    <div class="suspicion-label">怀疑度</div>
                    <div class="suspicion-bar">
                        <div class="suspicion-fill" style="width: ${suspicionLevel}%"></div>
                    </div>
                    <div class="suspicion-value">${suspicionLevel}%</div>
                </div>
            </div>
            <div class="character-actions">
                <button class="btn btn-primary talk-btn" data-character-id="${character.id}">
                    对话
                </button>
            </div>
        `;

        // 绑定对话按钮事件
        const talkBtn = card.querySelector('.talk-btn');
        talkBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止触发卡片点击事件
            this.handleCharacterSelect(character);
        });

        // 绑定卡片点击事件
        card.addEventListener('click', () => {
            this.handleCharacterSelect(character);
        });

        return card;
    }

    handleGameCompleted(game) {
        console.log('游戏完成:', game);
    }

    handleGameLoaded(game) {
        console.log('游戏加载:', game);
        this.showMainScreen();
        this.updateGameUI(game);
    }

    // 工具方法
    updateGenerateButton(isGenerating) {
        const btnText = this.elements.generateBtn.querySelector('.btn-text');
        const btnLoading = this.elements.generateBtn.querySelector('.btn-loading');

        if (isGenerating) {
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            this.elements.generateBtn.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            this.elements.generateBtn.disabled = false;
        }
    }

    setConversationInputState(enabled) {
        this.elements.questionInput.disabled = !enabled;
        this.elements.askQuestionBtn.disabled = !enabled;

        if (enabled) {
            this.elements.askQuestionBtn.textContent = '发送';
        } else {
            this.elements.askQuestionBtn.textContent = '发送中...';
        }
    }

    endConversation() {
        this.elements.conversationPanel.classList.add('hidden');
        this.currentCharacter = null;

        // 清除角色选择状态
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    loadConversationHistory(characterId) {
        this.elements.conversationHistory.innerHTML = '';

        const game = gameController.currentGame;
        if (!game) return;

        const conversations = game.gameProgress.conversationHistory.filter(
            conv => conv.characterId === characterId
        );

        conversations.forEach(conv => {
            this.addMessageToHistory('user', conv.question);
            this.addMessageToHistory('character', conv.response,
                game.script.characters.find(c => c.id === characterId));
        });
    }

    displayGameResult(data) {
        const { validation, truth } = data;

        this.elements.resultTitle.textContent = validation.correct ? '推理成功！' : '推理失败';

        const resultHTML = `
            <div class="result-score">
                <h3>得分: ${validation.score}/100</h3>
            </div>

            <div class="result-analysis">
                <h4>分析结果:</h4>
                <p><strong>事实准确性:</strong> ${validation.analysis.factAccuracy}/100</p>
                <p><strong>逻辑完整性:</strong> ${validation.analysis.logicCompleteness}/100</p>
                <p><strong>证据充分性:</strong> ${validation.analysis.evidenceStrength}/100</p>
            </div>

            <div class="result-feedback">
                <h4>详细反馈:</h4>
                <p>${validation.feedback}</p>
            </div>

            <div class="result-truth">
                <h4>真相揭示:</h4>
                <p><strong>真正的凶手:</strong> ${truth.killer}</p>
                <p><strong>作案手法:</strong> ${truth.method}</p>
                <p><strong>作案动机:</strong> ${truth.motive}</p>
            </div>
        `;

        this.elements.resultContent.innerHTML = resultHTML;
    }

    startNewGame() {
        gameController.resetGame();
        this.showSetupScreen();
    }

    reviewGame() {
        this.showMainScreen();
    }

    /**
     * 高亮角色卡片
     * @param {string} characterId - 角色ID
     */
    highlightCharacterCard(characterId) {
        // 清除所有高亮
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('highlighted');
        });

        // 高亮指定角色
        const targetCard = document.querySelector(`[data-character-id="${characterId}"]`);
        if (targetCard) {
            targetCard.classList.add('highlighted');
        }
    }

    /**
     * 清除角色高亮
     */
    clearCharacterHighlight() {
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('highlighted');
        });
    }

    /**
     * 重置所有组件
     */
    resetComponents() {
        // 重置关系图
        if (this.relationshipGraph) {
            this.relationshipGraph.reset();
        }

        // 重置线索管理器
        if (window.clueManager) {
            window.clueManager.clearClues();
        }

        // 重置对话系统
        if (window.dialogueSystem) {
            window.dialogueSystem.endConversation();
            window.dialogueSystem.clearHistory();
        }

        // 清除当前角色
        this.currentCharacter = null;
    }

    /**
     * 获取UI状态信息
     * @returns {Object}
     */
    getUIState() {
        return {
            currentScreen: this.currentScreen,
            currentCharacter: this.currentCharacter?.id || null,
            isGenerating: this.isGenerating,
            initialized: this.initialized,
            components: {
                relationshipGraph: !!this.relationshipGraph,
                clueManager: !!window.clueManager,
                dialogueSystem: !!window.dialogueSystem
            }
        };
    }
}

// 创建全局实例
window.uiController = new UIController();
