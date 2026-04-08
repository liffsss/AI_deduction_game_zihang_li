/**
 * 主程序入口文件
 * 负责应用的初始化和全局事件处理
 */

// 应用主类
class AIReasoningGame {
    constructor() {
        this.initialized = false;
        this.version = '1.0.0';
        
        console.log(`🎮 AI推理游戏 v${this.version} 启动中...`);
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('🚀 开始初始化应用...');
            
            // 检查浏览器兼容性
            this.checkBrowserCompatibility();
            
            // 初始化错误处理
            this.setupErrorHandling();
            
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // 初始化各个模块
            await this.initializeModules();
            
            // 设置全局事件监听
            this.setupGlobalEvents();
            
            // 应用初始化完成
            this.initialized = true;
            console.log('✅ 应用初始化完成');
            
            // 触发初始化完成事件
            this.dispatchEvent('app:initialized');
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 检查浏览器兼容性
     */
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'fetch',
            'Promise',
            'localStorage',
            'addEventListener'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            return typeof window[feature] === 'undefined';
        });
        
        if (missingFeatures.length > 0) {
            throw new Error(`浏览器不支持以下功能: ${missingFeatures.join(', ')}`);
        }
        
        console.log('✅ 浏览器兼容性检查通过');
    }

    /**
     * 初始化各个模块
     */
    async initializeModules() {
        console.log('📦 等待Bootstrap完成...');

        // 等待Bootstrap完成
        if (!window.uiController || !window.uiController.initialized) {
            await new Promise(resolve => {
                window.addEventListener('app:bootstrap:complete', resolve, { once: true });

                // 10秒超时保护
                setTimeout(() => {
                    console.warn('⚠️ Bootstrap超时，继续初始化');
                    resolve();
                }, 10000);
            });
        }

        // 最终检查必要模块
        const requiredModules = [
            'CONFIG',
            'Utils',
            'deepseekAPI',
            'tongYiAPI',
            'gameController',
            'uiController'
        ];

        const missingModules = requiredModules.filter(module => {
            return typeof window[module] === 'undefined';
        });

        if (missingModules.length > 0) {
            throw new Error(`缺少必要模块: ${missingModules.join(', ')}`);
        }

        console.log('✅ 模块初始化完成');
    }

    /**
     * 设置全局错误处理
     */
    setupErrorHandling() {
        // 捕获未处理的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise错误:', event.reason);
            this.handleError(event.reason, 'Promise错误');
            event.preventDefault();
        });
        
        // 捕获JavaScript运行时错误
        window.addEventListener('error', (event) => {
            console.error('JavaScript错误:', event.error);
            this.handleError(event.error, 'JavaScript错误');
        });
        
        console.log('✅ 错误处理设置完成');
    }

    /**
     * 设置全局事件监听
     */
    setupGlobalEvents() {
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 页面隐藏，暂停活动');
                this.handlePageHidden();
            } else {
                console.log('📱 页面显示，恢复活动');
                this.handlePageVisible();
            }
        });
        
        // 页面卸载前保存数据
        window.addEventListener('beforeunload', (event) => {
            this.handleBeforeUnload(event);
        });
        
        // 网络状态变化
        window.addEventListener('online', () => {
            console.log('🌐 网络连接恢复');
            this.handleNetworkOnline();
        });
        
        window.addEventListener('offline', () => {
            console.log('🌐 网络连接断开');
            this.handleNetworkOffline();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        console.log('✅ 全局事件监听设置完成');
    }

    /**
     * 处理初始化错误
     * @param {Error} error - 错误对象
     */
    handleInitializationError(error) {
        // 显示错误信息给用户
        const errorMessage = `应用初始化失败: ${error.message}`;
        
        // 尝试显示错误通知
        if (window.uiController && window.uiController.showNotification) {
            window.uiController.showNotification(errorMessage, 'error');
        } else {
            // 如果UI控制器不可用，使用原生alert
            alert(errorMessage);
        }
        
        // 显示简单的错误页面
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa;">
                <div style="text-align: center; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <h2 style="color: #e74c3c; margin-bottom: 1rem;">应用启动失败</h2>
                    <p style="color: #555; margin-bottom: 1rem;">${error.message}</p>
                    <button onclick="location.reload()" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 处理运行时错误
     * @param {Error} error - 错误对象
     * @param {string} type - 错误类型
     */
    handleError(error, type = '未知错误') {
        // 防止null错误导致无限循环
        if (!error) {
            console.warn('收到null错误，忽略处理');
            return;
        }

        console.error(`${type}:`, error);

        try {
            // 记录错误到本地存储（用于调试）
            if (window.Utils && window.Utils.storage) {
                const errorLog = Utils.storage.get('error_log', []);
                errorLog.push({
                    type: type,
                    message: error.message || '未知错误消息',
                    stack: error.stack || '无堆栈信息',
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                });

                // 只保留最近50条错误记录
                if (errorLog.length > 50) {
                    errorLog.splice(0, errorLog.length - 50);
                }

                Utils.storage.set('error_log', errorLog);
            }

            // 显示用户友好的错误提示
            if (window.uiController && window.uiController.showNotification) {
                const userMessage = this.getUserFriendlyErrorMessage(error);
                window.uiController.showNotification(userMessage, 'error');
            }
        } catch (handlingError) {
            console.error('错误处理过程中发生错误:', handlingError);
        }
    }

    /**
     * 获取用户友好的错误消息
     * @param {Error} error - 错误对象
     * @returns {string}
     */
    getUserFriendlyErrorMessage(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
            return '网络连接出现问题，请检查网络设置';
        } else if (message.includes('api') || message.includes('key')) {
            return 'API调用失败，请检查密钥配置';
        } else if (message.includes('parse') || message.includes('json')) {
            return '数据解析失败，请重试';
        } else {
            return '发生了未知错误，请刷新页面重试';
        }
    }

    /**
     * 页面隐藏时的处理
     */
    handlePageHidden() {
        // 暂停不必要的活动
        if (window.gameController) {
            window.gameController.emit('page:hidden');
        }
    }

    /**
     * 页面显示时的处理
     */
    handlePageVisible() {
        // 恢复活动
        if (window.gameController) {
            window.gameController.emit('page:visible');
        }
    }

    /**
     * 页面卸载前的处理
     * @param {Event} event - 事件对象
     */
    handleBeforeUnload(event) {
        // 如果游戏正在进行，提示用户
        if (window.gameController && 
            window.gameController.currentGame && 
            window.gameController.gameState === 'playing') {
            
            const message = '游戏正在进行中，确定要离开吗？';
            event.returnValue = message;
            return message;
        }
    }

    /**
     * 网络连接恢复时的处理
     */
    handleNetworkOnline() {
        if (window.uiController) {
            window.uiController.showNotification('网络连接已恢复', 'success');
        }
    }

    /**
     * 网络连接断开时的处理
     */
    handleNetworkOffline() {
        if (window.uiController) {
            window.uiController.showNotification('网络连接已断开，部分功能可能无法使用', 'warning');
        }
    }

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + R: 重新开始游戏
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            if (window.gameController && window.gameController.currentGame) {
                event.preventDefault();
                if (confirm('确定要重新开始游戏吗？')) {
                    window.gameController.resetGame();
                }
            }
        }
        
        // Escape: 关闭模态框或结束对话
        if (event.key === 'Escape') {
            if (window.uiController) {
                // 关闭模态框
                const modal = document.querySelector('.modal.show');
                if (modal) {
                    window.uiController.closeModal();
                    return;
                }
                
                // 结束对话
                if (window.uiController.currentCharacter) {
                    window.uiController.endConversation();
                }
            }
        }
    }

    /**
     * 触发自定义事件
     * @param {string} eventName - 事件名称
     * @param {*} detail - 事件详情
     */
    dispatchEvent(eventName, detail = null) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    /**
     * 获取应用状态信息
     * @returns {Object}
     */
    getAppInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            timestamp: new Date().toISOString(),
            modules: {
                config: typeof CONFIG !== 'undefined',
                utils: typeof Utils !== 'undefined',
                deepseekAPI: typeof deepseekAPI !== 'undefined',
                tongYiAPI: typeof tongYiAPI !== 'undefined',
                gameController: typeof gameController !== 'undefined',
                uiController: typeof uiController !== 'undefined'
            },
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                online: navigator.onLine
            }
        };
    }
}

// 创建应用实例并初始化
const app = new AIReasoningGame();

// 立即初始化应用
app.init().catch(error => {
    console.error('应用启动失败:', error);
});

// 将应用实例暴露到全局
window.app = app;

// 开发模式下的调试功能
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 开发模式已启用');
    
    // 暴露调试信息到全局
    window.debug = {
        getAppInfo: () => app.getAppInfo(),
        getErrorLog: () => Utils.storage.get('error_log', []),
        clearErrorLog: () => Utils.storage.remove('error_log'),
        getGameData: () => gameController.currentGame,
        resetGame: () => gameController.resetGame(),
        clearStorage: () => {
            localStorage.clear();
            location.reload();
        }
    };
    
    console.log('🔍 调试工具已加载，使用 window.debug 访问');
}
