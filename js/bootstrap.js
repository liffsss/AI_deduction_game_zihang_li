/**
 * 应用启动引导文件
 * 负责确保所有模块按正确顺序初始化
 */

(function() {
    'use strict';
    
    console.log('🚀 Bootstrap 启动中...');
    
    // 等待DOM加载完成
    function waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // 等待模块加载
    function waitForModule(moduleName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            function check() {
                if (window[moduleName]) {
                    console.log(`✅ 模块 ${moduleName} 已加载`);
                    resolve(window[moduleName]);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`模块 ${moduleName} 加载超时`));
                } else {
                    setTimeout(check, 50);
                }
            }
            
            check();
        });
    }
    
    // 初始化应用
    async function initializeApp() {
        try {
            console.log('📦 等待DOM加载...');
            await waitForDOM();
            
            console.log('📦 等待核心模块加载...');
            
            // 按顺序等待核心模块
            await waitForModule('CONFIG');
            await waitForModule('Utils');
            await waitForModule('deepseekAPI');
            await waitForModule('tongYiAPI');
            await waitForModule('gameController');
            
            // 等待UI控制器完全初始化
            console.log('🎨 等待UI控制器初始化...');
            await waitForModule('uiController');
            
            // 等待UI控制器完全初始化完成
            if (window.uiController && !window.uiController.initialized) {
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (window.uiController.initialized) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                    
                    // 10秒超时
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        resolve();
                    }, 10000);
                });
            }
            
            // 初始化可选组件
            console.log('🔧 初始化可选组件...');
            
            // 初始化对话系统
            if (typeof DialogueSystem !== 'undefined') {
                window.dialogueSystem = new DialogueSystem();
                console.log('✅ 对话系统已初始化');
            }
            
            // 初始化线索管理器
            if (typeof ClueManager !== 'undefined') {
                window.clueManager = new ClueManager();
                console.log('✅ 线索管理器已初始化');
            }
            
            // 初始化作家风格选择器
            if (typeof AuthorStyleSelector !== 'undefined') {
                window.authorStyleSelector = new AuthorStyleSelector();
                console.log('✅ 作家风格选择器已初始化');
            }
            
            console.log('🎉 Bootstrap 初始化完成！');
            
            // 触发初始化完成事件
            window.dispatchEvent(new CustomEvent('app:bootstrap:complete'));
            
        } catch (error) {
            console.error('❌ Bootstrap 初始化失败:', error);
            
            // 显示错误信息
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa;">
                    <div style="text-align: center; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 500px;">
                        <h2 style="color: #e74c3c; margin-bottom: 1rem;">应用初始化失败</h2>
                        <p style="color: #555; margin-bottom: 1rem;">${error.message}</p>
                        <p style="color: #777; font-size: 0.9rem; margin-bottom: 1.5rem;">请检查控制台获取详细错误信息</p>
                        <button onclick="location.reload()" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; margin-right: 0.5rem;">
                            重新加载
                        </button>
                        <button onclick="localStorage.clear(); location.reload()" style="background: #e67e22; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;">
                            清除缓存并重载
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    // 立即执行初始化
    initializeApp();
    
})();
