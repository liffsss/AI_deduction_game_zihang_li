/**
 * 对话系统和线索管理修复脚本
 * 修复线索显示和对话状态问题
 */

console.log('🔧 开始应用对话系统和线索管理修复...');

// 等待所有组件初始化完成
setTimeout(() => {
    console.log('🔧 延迟执行修复脚本，确保组件已初始化');

// 1. 修复线索管理器的addClue方法
if (window.clueManager) {
    console.log('🔧 修复线索管理器...');
    
    // 保存原始方法
    const originalAddClue = window.clueManager.addClue.bind(window.clueManager);
    
    // 重写addClue方法
    window.clueManager.addClue = function(clue) {
        console.log('🔧 修复版本 - 添加线索:', clue.name);
        
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
    };
    
    // 添加强制刷新方法
    window.clueManager.refreshCluesDisplay = function() {
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
    };
}

// 2. 对话系统修复已在主文件中完成，这里不再重写方法

// 3. 添加全局状态监听器
document.addEventListener('cluesUpdated', function(event) {
    console.log('🔧 线索更新事件:', event.detail);
    
    // 更新UI显示
    if (window.uiController) {
        const cluesCountElement = document.querySelector('#clues-count, .clues-count');
        if (cluesCountElement) {
            cluesCountElement.textContent = event.detail.count;
        }
    }
});

// 4. 修复UI控制器的线索更新
if (window.uiController) {
    console.log('🔧 修复UI控制器线索处理...');
    
    const originalHandleClueDiscovered = window.uiController.handleClueDiscovered;
    if (originalHandleClueDiscovered) {
        window.uiController.handleClueDiscovered = function(clue) {
            console.log('🔧 修复版本 - UI处理新线索:', clue);
            
            // 调用原始方法
            originalHandleClueDiscovered.call(this, clue);
            
            // 额外的强制更新
            setTimeout(() => {
                if (window.clueManager) {
                    window.clueManager.refreshCluesDisplay();
                }
            }, 200);
        };
    }
}

// 5. 添加调试工具
window.debugDialogueClue = {
    checkClueManager: () => {
        console.log('线索管理器状态:', {
            exists: !!window.clueManager,
            cluesCount: window.clueManager?.clues?.length || 0,
            elements: window.clueManager?.elements
        });
    },
    
    checkDialogueSystem: () => {
        console.log('对话系统状态:', {
            exists: !!window.dialogueSystem,
            currentCharacter: window.dialogueSystem?.currentCharacter?.name || 'none',
            elements: window.dialogueSystem?.elements
        });
    },
    
    forceRefreshClues: () => {
        if (window.clueManager && window.clueManager.refreshCluesDisplay) {
            window.clueManager.refreshCluesDisplay();
            console.log('✅ 强制刷新线索完成');
        }
    },
    
    resetDialogueState: () => {
        if (window.dialogueSystem) {
            window.dialogueSystem.endConversation();
            window.dialogueSystem.setInputState(true);
            console.log('✅ 对话状态重置完成');
        }
    }
};

console.log('✅ 对话系统和线索管理修复完成！');
console.log('💡 可以使用 window.debugDialogueClue 进行调试');

}, 1000); // 延迟1秒执行，确保所有组件都已初始化
