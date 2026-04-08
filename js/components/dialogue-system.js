/**
 * 对话系统组件
 * 负责管理角色对话的展示和交互
 */

class DialogueSystem {
    constructor() {
        this.currentCharacter = null;
        this.conversationHistory = [];
        this.isTyping = false;
        this.isProcessing = false; // 防止重复处理
        this.typingSpeed = 50; // 打字机效果速度

        // DOM元素
        this.elements = {
            conversationPanel: null,
            conversationHistory: null,
            questionInput: null,
            askButton: null,
            characterAvatar: null,
            characterName: null,
            characterRole: null,
            endConversationBtn: null
        };

        this.init();
    }

    /**
     * 初始化对话系统
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.verifyEventBinding();
        console.log('✅ 对话系统初始化完成');
    }

    /**
     * 验证事件绑定
     */
    verifyEventBinding() {
        console.log('🔧 验证事件绑定...');

        if (this.elements.questionInput) {
            // 测试输入框是否能正确响应
            console.log('✅ 输入框元素存在');
            console.log('🔧 输入框当前值:', this.elements.questionInput.value);
            console.log('🔧 输入框是否禁用:', this.elements.questionInput.disabled);
        } else {
            console.error('❌ 输入框元素不存在');
        }

        if (this.elements.askButton) {
            console.log('✅ 发送按钮元素存在');
        } else {
            console.error('❌ 发送按钮元素不存在');
        }
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements.conversationPanel = document.getElementById('conversation-panel');
        this.elements.conversationHistory = document.getElementById('conversation-history');
        this.elements.questionInput = document.getElementById('question-input');
        this.elements.askButton = document.getElementById('ask-question-btn');
        this.elements.characterAvatar = document.getElementById('current-character-avatar');
        this.elements.characterName = document.getElementById('current-character-name');
        this.elements.characterRole = document.getElementById('current-character-role');
        this.elements.endConversationBtn = document.getElementById('end-conversation-btn');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        console.log('🔧 绑定对话系统事件...');

        // 提问按钮点击
        if (this.elements.askButton) {
            this.elements.askButton.addEventListener('click', () => {
                console.log('🔧 发送按钮被点击');
                console.log('🔧 点击时输入框值:', this.elements.questionInput.value);
                this.handleAskQuestion();
            });
            console.log('✅ 发送按钮事件已绑定');
        } else {
            console.warn('⚠️ 发送按钮元素未找到');
        }

        // 输入框回车
        if (this.elements.questionInput) {
            this.elements.questionInput.addEventListener('keypress', (e) => {
                console.log('🔧 输入框按键事件:', e.key);
                console.log('🔧 按键时输入框值:', this.elements.questionInput.value);
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('🔧 回车键触发发送，当前值:', this.elements.questionInput.value);
                    this.handleAskQuestion();
                }
            });

            // 输入框焦点事件
            this.elements.questionInput.addEventListener('focus', () => {
                this.elements.conversationPanel.classList.add('input-focused');
            });

            this.elements.questionInput.addEventListener('blur', () => {
                this.elements.conversationPanel.classList.remove('input-focused');
            });

            console.log('✅ 输入框事件已绑定');
        } else {
            console.warn('⚠️ 输入框元素未找到');
        }

        // 结束对话按钮
        if (this.elements.endConversationBtn) {
            this.elements.endConversationBtn.addEventListener('click', () => this.endConversation());
        }
    }

    /**
     * 开始与角色对话
     * @param {Object} character - 角色信息
     */
    startConversation(character) {
        console.log(`🔧 对话系统开始对话，角色:`, character);
        this.currentCharacter = character;
        this.showConversationPanel();
        this.updateCharacterInfo(character);
        this.loadConversationHistory(character.id);
        this.focusInput();

        console.log(`💬 开始与${character.name}对话，当前角色已设置:`, this.currentCharacter);
    }

    /**
     * 显示对话面板
     */
    showConversationPanel() {
        if (this.elements.conversationPanel) {
            this.elements.conversationPanel.classList.remove('hidden');
            this.elements.conversationPanel.classList.add('conversation-active');
        }
    }

    /**
     * 隐藏对话面板
     */
    hideConversationPanel() {
        if (this.elements.conversationPanel) {
            this.elements.conversationPanel.classList.add('hidden');
            this.elements.conversationPanel.classList.remove('conversation-active');
        }
    }

    /**
     * 更新角色信息显示
     * @param {Object} character - 角色信息
     */
    updateCharacterInfo(character) {
        if (this.elements.characterAvatar) {
            this.elements.characterAvatar.src = this.getCharacterAvatarUrl(character);
            this.elements.characterAvatar.alt = `${character.name}的头像`;
        }

        if (this.elements.characterName) {
            this.elements.characterName.textContent = character.name;
        }

        if (this.elements.characterRole) {
            this.elements.characterRole.textContent = this.getRoleText(character.role);
        }
    }

    /**
     * 获取角色头像URL
     * @param {Object} character - 角色信息
     * @returns {string}
     */
    getCharacterAvatarUrl(character) {
        const game = gameController.currentGame;
        if (game && game.images.characters[character.id]) {
            return tongYiAPI.getProxyImageUrl(game.images.characters[character.id].imageUrl);
        }
        return '/assets/default-avatar.png';
    }

    /**
     * 获取角色文本
     * @param {string} role - 角色类型
     * @returns {string}
     */
    getRoleText(role) {
        const roleMap = {
            suspect: '嫌疑人',
            witness: '证人',
            victim: '受害者',
            detective: '侦探'
        };
        return roleMap[role] || role;
    }

    /**
     * 加载对话历史
     * @param {string} characterId - 角色ID
     */
    loadConversationHistory(characterId) {
        if (!this.elements.conversationHistory) return;

        // 清空对话历史
        this.elements.conversationHistory.innerHTML = '';

        const gameController = window.gameController;
        if (!gameController || !gameController.currentGame) return;

        const game = gameController.currentGame;

        // 获取与该角色的对话记录
        const conversations = game.gameProgress.conversationHistory.filter(
            conv => conv.characterId === characterId
        );

        // 显示历史对话
        conversations.forEach(conv => {
            this.addUserMessage(conv.question, false);
            this.addCharacterMessage(conv.response, false);
        });

        // 如果没有历史对话，显示欢迎消息
        if (conversations.length === 0) {
            this.addCharacterMessage(this.getWelcomeMessage(this.currentCharacter), false);
        }

        this.scrollToBottom();
    }

    /**
     * 获取欢迎消息
     * @param {Object} character - 角色信息
     * @returns {string}
     */
    getWelcomeMessage(character) {
        const welcomeMessages = {
            suspect: `你好，我是${character.name}。我知道你想了解案件的情况，我会尽力配合调查的。`,
            witness: `你好，我是${character.name}。我看到了一些事情，也许能帮助你找到真相。`,
            victim: `你好，我是${character.name}。虽然我是受害者，但我记得一些重要的细节。`,
            detective: `你好，我是${character.name}。让我们一起分析这个案件，找出真相。`
        };

        return welcomeMessages[character.role] || `你好，我是${character.name}。有什么想问我的吗？`;
    }

    /**
     * 处理提问
     */
    async handleAskQuestion() {
        // 防止重复调用
        if (this.isProcessing) {
            console.log('🔧 正在处理中，跳过重复调用');
            return;
        }

        this.isProcessing = true;

        console.log('🔧 handleAskQuestion 被调用');
        console.log('🔧 对话系统当前角色:', this.currentCharacter);
        console.log('🔧 UI控制器当前角色:', window.uiController?.currentCharacter);
        console.log('🔧 输入框元素:', this.elements.questionInput);
        console.log('🔧 输入框值:', this.elements.questionInput?.value);

        // 如果对话系统没有角色，但UI控制器有，则同步
        if (!this.currentCharacter && window.uiController?.currentCharacter) {
            console.log('🔧 从UI控制器同步角色状态');
            this.currentCharacter = window.uiController.currentCharacter;
        }

        if (!this.currentCharacter) {
            console.log('❌ 没有选择角色');
            this.showError('请先选择要对话的角色');
            this.isProcessing = false;
            return;
        }

        const question = this.elements.questionInput.value.trim();
        console.log('🔧 原始输入框值:', this.elements.questionInput.value);
        console.log('🔧 处理后的问题:', question);
        console.log('🔧 问题长度:', question.length);
        console.log('🔧 问题是否为空:', !question);

        if (!question) {
            console.log('❌ 问题为空，输入框当前值:', this.elements.questionInput.value);
            this.showError('请输入问题');
            this.isProcessing = false;
            return;
        }

        console.log('✅ 验证通过，开始处理对话');

        try {
            // 禁用输入
            this.setInputState(false);

            // 添加用户消息
            this.addUserMessage(question);

            // 清空输入框
            this.elements.questionInput.value = '';

            // 显示角色正在思考
            this.showTypingIndicator();

            // 调用游戏控制器进行对话
            const result = await gameController.talkToCharacter(this.currentCharacter.id, question);

            // 隐藏思考指示器
            this.hideTypingIndicator();

            // 添加角色回应
            this.addCharacterMessage(result.conversation.response);

            // 处理新线索
            if (result.newClues && result.newClues.length > 0) {
                console.log('🔍 处理新线索:', result.newClues);
                this.showClueDiscoveredAnimation(result.newClues);

                // 确保线索管理器正确更新
                result.newClues.forEach(clue => {
                    if (window.clueManager && window.clueManager.refreshCluesDisplay) {
                        setTimeout(() => {
                            window.clueManager.refreshCluesDisplay();
                        }, 500);
                    }
                });
            }

            // 处理新发现的角色
            if (result.discoveredCharacters && result.discoveredCharacters.length > 0) {
                this.showCharacterDiscoveredAnimation(result.discoveredCharacters);
            }

        } catch (error) {
            console.error('对话失败:', error);
            this.hideTypingIndicator();
            this.showError(error.message);
        } finally {
            // 恢复输入
            this.setInputState(true);
            this.focusInput();
            // 重置处理标志
            this.isProcessing = false;
        }
    }

    /**
     * 添加用户消息
     * @param {string} message - 消息内容
     * @param {boolean} animate - 是否动画显示
     */
    addUserMessage(message, animate = true) {
        const messageElement = this.createMessageElement('user', message, {
            avatar: '/assets/user-avatar.png',
            name: '你'
        });

        this.appendMessage(messageElement, animate);
    }

    /**
     * 添加角色消息
     * @param {string} message - 消息内容
     * @param {boolean} animate - 是否动画显示
     */
    addCharacterMessage(message, animate = true) {
        if (!this.currentCharacter) return;

        const messageElement = this.createMessageElement('character', message, {
            avatar: this.getCharacterAvatarUrl(this.currentCharacter),
            name: this.currentCharacter.name
        });

        this.appendMessage(messageElement, animate);

        // 处理JSON格式的回复
        let responseData = message;
        if (typeof message === 'string') {
            try {
                responseData = JSON.parse(message);
            } catch (e) {
                responseData = null;
            }
        }

        if (responseData && typeof responseData === 'object') {
            this.handleCharacterResponse(responseData);

            // 如果需要动画，使用打字机效果显示主要回复内容
            if (animate) {
                this.typewriterEffect(messageElement.querySelector('.message-content'), responseData.response || message);
            }
        } else {
            // 如果需要动画，使用打字机效果
            if (animate) {
                this.typewriterEffect(messageElement.querySelector('.message-content'), message);
            }
        }
    }

    /**
     * 创建消息元素
     * @param {string} type - 消息类型
     * @param {string|Object} content - 消息内容或JSON对象
     * @param {Object} sender - 发送者信息
     * @returns {HTMLElement}
     */
    createMessageElement(type, content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        // 处理角色回复（可能是JSON格式）
        let responseData = content;
        if (typeof content === 'string') {
            try {
                responseData = JSON.parse(content);
            } catch (e) {
                responseData = { response: content };
            }
        }

        const avatarImg = document.createElement('img');
        avatarImg.className = 'message-avatar';
        avatarImg.src = sender.avatar || '/images/default-avatar.png';
        avatarImg.alt = `${sender.name}的头像`;

        // 添加头像加载错误处理
        avatarImg.onerror = function() {
            this.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="20" fill="#95a5a6"/>
                    <circle cx="20" cy="15" r="6" fill="white"/>
                    <path d="M8 35 C8 28, 13 25, 20 25 C27 25, 32 28, 32 35" fill="white"/>
                </svg>
            `);
        };

        // 创建消息内容容器
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // 角色名称和情绪状态
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'message-name';
        nameSpan.textContent = sender.name;
        headerDiv.appendChild(nameSpan);

        // 情绪状态指示器
        if (responseData.emotion) {
            const emotionSpan = document.createElement('span');
            emotionSpan.className = 'message-emotion';
            emotionSpan.innerHTML = `${this.getEmotionIcon(responseData.emotion)} ${responseData.emotion}`;
            headerDiv.appendChild(emotionSpan);
        }

        messageContainer.appendChild(headerDiv);

        // 主要回复内容
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = responseData.response || content;
        messageContainer.appendChild(contentDiv);

        // 角色状态描述
        if (responseData.characterState) {
            const stateDiv = document.createElement('div');
            stateDiv.className = 'message-state';
            stateDiv.innerHTML = `💭 <em>${responseData.characterState}</em>`;
            messageContainer.appendChild(stateDiv);
        }

        // 新线索提示
        if (responseData.newClues && responseData.newClues.length > 0) {
            const cluesDiv = document.createElement('div');
            cluesDiv.className = 'message-clues';
            cluesDiv.innerHTML = `🔍 发现了 ${responseData.newClues.length} 条新线索`;
            messageContainer.appendChild(cluesDiv);
        }

        // 怀疑度变化
        if (responseData.suspicionChange && responseData.suspicionChange !== 0) {
            const suspicionDiv = document.createElement('div');
            suspicionDiv.className = 'message-suspicion';
            const change = responseData.suspicionChange > 0 ? '+' : '';
            suspicionDiv.innerHTML = `📊 怀疑度 ${change}${responseData.suspicionChange}`;
            messageContainer.appendChild(suspicionDiv);
        }

        // 时间戳
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        const utils = window.Utils || { formatTime: (timestamp) => new Date(timestamp).toLocaleTimeString('zh-CN') };
        timeDiv.textContent = utils.formatTime(Date.now());
        messageContainer.appendChild(timeDiv);

        messageDiv.appendChild(avatarImg);
        messageDiv.appendChild(messageContainer);

        // 存储原始数据用于后续处理
        messageDiv.dataset.responseData = JSON.stringify(responseData);

        return messageDiv;
    }

    /**
     * 获取情绪对应的图标
     * @param {string} emotion - 情绪状态
     * @returns {string}
     */
    getEmotionIcon(emotion) {
        const emotionIcons = {
            '冷静': '😐',
            '紧张': '😰',
            '愤怒': '😠',
            '悲伤': '😢',
            '恐惧': '😨',
            '惊讶': '😲',
            '困惑': '😕',
            '自信': '😎',
            '焦虑': '😟',
            '无奈': '😔',
            '警惕': '🤨',
            '轻松': '😌'
        };
        return emotionIcons[emotion] || '😐';
    }

    /**
     * 处理角色回复中的新线索
     * @param {Object} responseData - 角色回复数据
     */
    handleCharacterResponse(responseData) {
        // 处理新线索 - 通过游戏控制器统一处理
        if (responseData.newClues && responseData.newClues.length > 0) {
            console.log('🔍 对话系统处理新线索:', responseData.newClues);

            responseData.newClues.forEach(clue => {
                // 确保线索有完整的信息
                const completeClue = {
                    id: clue.id || `clue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: clue.name || '未知线索',
                    description: clue.description || '暂无描述',
                    importance: clue.importance || 'medium',
                    location: clue.location || '对话中发现',
                    relatedCharacters: clue.relatedCharacters || [this.currentCharacter?.id],
                    discoveredAt: new Date().toISOString(),
                    source: 'dialogue'
                };

                // 通过游戏控制器统一处理新线索
                if (window.gameController) {
                    window.gameController.handleNewClue(completeClue);
                }

                // 直接通过线索管理器添加线索
                if (window.clueManager) {
                    window.clueManager.addClue(completeClue);
                }
            });

            // 延迟刷新确保显示更新
            setTimeout(() => {
                if (window.clueManager && window.clueManager.refreshCluesDisplay) {
                    window.clueManager.refreshCluesDisplay();
                }
            }, 500);
        }

        // 处理怀疑度变化
        if (responseData.suspicionChange && responseData.suspicionChange !== 0 && this.currentCharacter) {
            // 更新角色的怀疑度
            this.currentCharacter.suspicionLevel = (this.currentCharacter.suspicionLevel || 0) + responseData.suspicionChange;

            // 通知游戏控制器更新怀疑度
            if (window.gameController) {
                window.gameController.updateSuspicionLevel(this.currentCharacter.id, responseData.suspicionChange);
            }
        }

        // 处理角色状态变化
        if (responseData.characterState && this.currentCharacter) {
            this.currentCharacter.currentState = responseData.characterState;
            this.currentCharacter.currentEmotion = responseData.emotion;
        }
    }

    /**
     * 添加消息到对话历史
     * @param {HTMLElement} messageElement - 消息元素
     * @param {boolean} animate - 是否动画显示
     */
    appendMessage(messageElement, animate = true) {
        if (!this.elements.conversationHistory) return;

        if (animate) {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(20px)';
        }

        this.elements.conversationHistory.appendChild(messageElement);

        if (animate) {
            // 动画显示
            requestAnimationFrame(() => {
                messageElement.style.transition = 'all 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        }

        this.scrollToBottom();
    }

    /**
     * 打字机效果
     * @param {HTMLElement} element - 目标元素
     * @param {string} text - 文本内容
     */
    typewriterEffect(element, text) {
        if (!element || this.isTyping) return;

        this.isTyping = true;
        element.textContent = '';

        let index = 0;
        const timer = setInterval(() => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                this.scrollToBottom();
            } else {
                clearInterval(timer);
                this.isTyping = false;
            }
        }, this.typingSpeed);
    }

    /**
     * 显示正在输入指示器
     */
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message character">
                <img class="message-avatar" src="${this.getCharacterAvatarUrl(this.currentCharacter)}" alt="头像">
                <div class="message-content typing">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        this.elements.conversationHistory.appendChild(indicator);
        this.scrollToBottom();
    }

    /**
     * 隐藏正在输入指示器
     */
    hideTypingIndicator() {
        const indicator = this.elements.conversationHistory.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * 显示线索发现动画
     * @param {Array} clues - 新发现的线索
     */
    showClueDiscoveredAnimation(clues) {
        clues.forEach((clue, index) => {
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.className = 'clue-notification';
                notification.innerHTML = `
                    <div class="clue-icon">🔍</div>
                    <div class="clue-text">
                        <strong>发现新线索！</strong><br>
                        ${clue.name}
                    </div>
                `;

                document.body.appendChild(notification);

                // 动画显示
                setTimeout(() => notification.classList.add('show'), 100);

                // 自动移除
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }, index * 500);
        });
    }

    /**
     * 显示角色发现动画
     * @param {Array} discoveredCharacters - 新发现的角色
     */
    showCharacterDiscoveredAnimation(discoveredCharacters) {
        discoveredCharacters.forEach((discovery, index) => {
            setTimeout(() => {
                const character = discovery.character;
                const notification = document.createElement('div');
                notification.className = 'character-notification';
                notification.innerHTML = `
                    <div class="character-icon">👤</div>
                    <div class="character-text">
                        <strong>发现新角色！</strong><br>
                        ${character.name}
                        <div class="character-context">${discovery.context}</div>
                        <button class="btn btn-sm btn-primary talk-to-character" data-character-id="${character.id}">
                            与${character.name}对话
                        </button>
                    </div>
                `;

                document.body.appendChild(notification);

                // 绑定对话按钮事件
                const talkButton = notification.querySelector('.talk-to-character');
                talkButton.addEventListener('click', () => {
                    this.switchToCharacter(character);
                    notification.remove();
                });

                // 动画显示
                setTimeout(() => notification.classList.add('show'), 100);

                // 自动移除
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, 5000);

                // 触发角色发现事件
                document.dispatchEvent(new CustomEvent('characterDiscovered', {
                    detail: {
                        character: character,
                        context: discovery.context,
                        hint: discovery.hint
                    }
                }));

            }, index * 1000 + 500); // 稍微延迟，让线索动画先播放
        });
    }

    /**
     * 切换到新角色对话
     * @param {Object} character - 角色信息
     */
    switchToCharacter(character) {
        // 结束当前对话
        this.endConversation();

        // 开始新对话
        setTimeout(() => {
            this.startConversation(character);
        }, 300);
    }

    /**
     * 设置输入状态
     * @param {boolean} enabled - 是否启用
     */
    setInputState(enabled) {
        if (this.elements.questionInput) {
            this.elements.questionInput.disabled = !enabled;
        }

        if (this.elements.askButton) {
            this.elements.askButton.disabled = !enabled;
            this.elements.askButton.textContent = enabled ? '发送' : '发送中...';
        }
    }

    /**
     * 聚焦输入框
     */
    focusInput() {
        if (this.elements.questionInput && !this.elements.questionInput.disabled) {
            this.elements.questionInput.focus();
        }
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        if (this.elements.conversationHistory) {
            this.elements.conversationHistory.scrollTop = this.elements.conversationHistory.scrollHeight;
        }
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        if (window.uiController && window.uiController.showNotification) {
            window.uiController.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * 结束对话
     */
    endConversation() {
        this.currentCharacter = null;
        this.hideConversationPanel();

        // 清除角色选择状态
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });

        console.log('💬 对话已结束');
    }

    /**
     * 清空对话历史
     */
    clearHistory() {
        if (this.elements.conversationHistory) {
            this.elements.conversationHistory.innerHTML = '';
        }
    }

    /**
     * 获取当前对话的统计信息
     * @returns {Object}
     */
    getConversationStats() {
        if (!this.currentCharacter) return null;

        const game = gameController.currentGame;
        if (!game) return null;

        const conversations = game.gameProgress.conversationHistory.filter(
            conv => conv.characterId === this.currentCharacter.id
        );

        return {
            characterId: this.currentCharacter.id,
            characterName: this.currentCharacter.name,
            messageCount: conversations.length,
            cluesDiscovered: conversations.reduce((total, conv) =>
                total + (conv.newClues ? conv.newClues.length : 0), 0
            )
        };
    }
}

// 不在这里创建全局实例，由bootstrap.js统一管理
