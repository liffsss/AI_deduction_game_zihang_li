/**
 * 人物关系图可视化组件
 * 使用D3.js实现动态交互式人物关系图
 */

class RelationshipGraph {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];

        // 配置参数 - 使用默认值以防CONFIG未加载
        const defaultConfig = {
            width: 280,
            height: 280,
            nodeRadius: 20,
            linkDistance: 80,
            chargeStrength: -200
        };

        this.config = {
            width: (window.CONFIG?.UI?.relationshipGraph?.width) || defaultConfig.width,
            height: (window.CONFIG?.UI?.relationshipGraph?.height) || defaultConfig.height,
            nodeRadius: (window.CONFIG?.UI?.relationshipGraph?.nodeRadius) || defaultConfig.nodeRadius,
            linkDistance: (window.CONFIG?.UI?.relationshipGraph?.linkDistance) || defaultConfig.linkDistance,
            chargeStrength: (window.CONFIG?.UI?.relationshipGraph?.chargeStrength) || defaultConfig.chargeStrength,
            colors: {
                suspect: '#e74c3c',
                witness: '#3498db',
                victim: '#95a5a6',
                detective: '#2ecc71',
                default: '#34495e'
            },
            linkTypes: {
                family: { color: '#2ecc71', width: 3 },
                friend: { color: '#3498db', width: 2 },
                enemy: { color: '#e74c3c', width: 2, dash: '5,5' },
                colleague: { color: '#f39c12', width: 2 },
                stranger: { color: '#95a5a6', width: 1 },
                default: { color: '#bdc3c7', width: 1 }
            }
        };

        // 事件回调
        this.onNodeClick = null;
        this.onNodeHover = null;

        this.init();
    }

    /**
     * 初始化关系图
     */
    init() {
        if (!this.container) {
            console.error('关系图容器不存在:', this.containerId);
            return;
        }

        // 清空容器
        this.container.innerHTML = '';

        // 创建SVG
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', this.config.width)
            .attr('height', this.config.height)
            .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
            .style('border', '1px solid #e0e0e0')
            .style('border-radius', '8px')
            .style('background', '#fafafa');

        // 添加缩放功能
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                this.svg.select('.graph-container')
                    .attr('transform', event.transform);
            });

        this.svg.call(zoom);

        // 创建图形容器
        this.graphContainer = this.svg.append('g')
            .attr('class', 'graph-container');

        // 创建连线组
        this.linkGroup = this.graphContainer.append('g')
            .attr('class', 'links');

        // 创建节点组
        this.nodeGroup = this.graphContainer.append('g')
            .attr('class', 'nodes');

        // 初始化力导向模拟
        this.initSimulation();

        console.log('✅ 关系图初始化完成');
    }

    /**
     * 初始化力导向模拟
     */
    initSimulation() {
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(this.config.linkDistance))
            .force('charge', d3.forceManyBody().strength(this.config.chargeStrength))
            .force('center', d3.forceCenter(this.config.width / 2, this.config.height / 2))
            .force('collision', d3.forceCollide().radius(this.config.nodeRadius + 5))
            .force('x', d3.forceX(this.config.width / 2).strength(0.1))
            .force('y', d3.forceY(this.config.height / 2).strength(0.1));
    }

    /**
     * 更新关系图数据
     * @param {Array} characters - 角色数据
     * @param {Object} suspicionLevels - 怀疑度数据
     */
    updateData(characters, suspicionLevels = {}) {
        console.log('🔄 关系图更新数据:', characters.length, '个角色');

        // 构建节点数据
        this.nodes = characters.map((character, index) => ({
            id: character.id,
            name: character.name,
            role: character.role,
            suspicion: suspicionLevels[character.id] || character.suspicionLevel || 0,
            // 设置初始位置在画布中心附近
            x: this.config.width / 2 + (Math.random() - 0.5) * 100,
            y: this.config.height / 2 + (Math.random() - 0.5) * 100,
            ...character
        }));

        // 构建连线数据
        this.links = this.extractRelationships(characters);

        console.log('📊 关系图数据:', this.nodes.length, '个节点,', this.links.length, '条连线');

        // 更新可视化
        this.render();
    }

    /**
     * 从角色数据中提取关系
     * @param {Array} characters - 角色数据
     * @returns {Array} 关系连线数据
     */
    extractRelationships(characters) {
        const links = [];

        try {
            characters.forEach(character => {
                if (character && character.relationships && character.id) {
                    Object.entries(character.relationships).forEach(([targetId, relationship]) => {
                        // 确保目标角色存在
                        const targetExists = characters.some(c => c && c.id === targetId);

                        if (targetExists) {
                            // 避免重复连线
                            const existingLink = links.find(link =>
                                (link.source === character.id && link.target === targetId) ||
                                (link.source === targetId && link.target === character.id)
                            );

                            if (!existingLink) {
                                links.push({
                                    source: character.id,
                                    target: targetId,
                                    relationship: relationship || '未知关系',
                                    type: this.getRelationshipType(relationship)
                                });
                            }
                        }
                    });
                }
            });
        } catch (error) {
            console.error('提取关系数据时出错:', error);
        }

        return links;
    }

    /**
     * 获取关系类型
     * @param {string} relationship - 关系描述
     * @returns {string} 关系类型
     */
    getRelationshipType(relationship) {
        const rel = relationship.toLowerCase();

        if (rel.includes('家人') || rel.includes('父') || rel.includes('母') ||
            rel.includes('兄') || rel.includes('姐') || rel.includes('夫') || rel.includes('妻')) {
            return 'family';
        } else if (rel.includes('朋友') || rel.includes('好友')) {
            return 'friend';
        } else if (rel.includes('敌人') || rel.includes('仇人') || rel.includes('对立')) {
            return 'enemy';
        } else if (rel.includes('同事') || rel.includes('同学') || rel.includes('合作')) {
            return 'colleague';
        } else if (rel.includes('陌生') || rel.includes('不认识')) {
            return 'stranger';
        } else {
            return 'default';
        }
    }

    /**
     * 渲染关系图
     */
    render() {
        try {
            if (!this.nodes || this.nodes.length === 0) {
                console.log('⚠️ 关系图无数据，显示空状态');
                this.showEmptyState();
                return;
            }

            console.log('🎨 开始渲染关系图:', this.nodes.length, '个节点');

            // 验证节点数据结构
            this.nodes = this.nodes.filter(node => node && node.id && node.name);

            if (this.nodes.length === 0) {
                console.warn('⚠️ 所有节点数据无效');
                this.showEmptyState();
                return;
            }

            // 更新连线
            this.renderLinks();

            // 更新节点
            this.renderNodes();
        } catch (error) {
            console.error('关系图渲染错误:', error);
            this.showEmptyState();
        }

        // 确保数据结构正确
        const validLinks = this.links.filter(link => {
            const sourceNode = this.nodes.find(n => n.id === (link.source.id || link.source));
            const targetNode = this.nodes.find(n => n.id === (link.target.id || link.target));
            return sourceNode && targetNode;
        });

        // 更新模拟
        this.simulation
            .nodes(this.nodes)
            .on('tick', () => this.tick());

        // 更新连线力，确保source和target是正确的引用
        this.simulation.force('link')
            .links(validLinks)
            .id(d => d.id);

        // 确保力导向的中心点正确设置
        this.simulation.force('center', d3.forceCenter(this.config.width / 2, this.config.height / 2));
        this.simulation.force('x', d3.forceX(this.config.width / 2).strength(0.1));
        this.simulation.force('y', d3.forceY(this.config.height / 2).strength(0.1));

        // 重启模拟
        this.simulation.alpha(1).restart();
    }

    /**
     * 渲染连线
     */
    renderLinks() {
        // 确保links数据结构正确
        const validLinks = this.links.filter(link => {
            const sourceNode = this.nodes.find(n => n.id === (link.source.id || link.source));
            const targetNode = this.nodes.find(n => n.id === (link.target.id || link.target));
            return sourceNode && targetNode;
        });

        const linkSelection = this.linkGroup
            .selectAll('.link')
            .data(validLinks, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

        // 移除旧连线
        linkSelection.exit().remove();

        // 添加新连线
        const linkEnter = linkSelection.enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke-width', d => this.config.linkTypes?.[d.type]?.width || 1)
            .style('stroke', d => this.config.linkTypes?.[d.type]?.color || '#bdc3c7')
            .style('stroke-dasharray', d => this.config.linkTypes?.[d.type]?.dash || 'none')
            .style('opacity', 0.6);

        // 添加连线标签
        linkEnter.append('title')
            .text(d => d.relationship || '未知关系');

        // 合并选择
        this.linkSelection = linkEnter.merge(linkSelection);
    }

    /**
     * 渲染节点
     */
    renderNodes() {
        const nodeSelection = this.nodeGroup
            .selectAll('.node')
            .data(this.nodes, d => d.id);

        // 移除旧节点
        nodeSelection.exit().remove();

        // 添加新节点
        const nodeEnter = nodeSelection.enter()
            .append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .call(this.createDragBehavior());

        // 添加节点圆圈
        nodeEnter.append('circle')
            .attr('r', this.config.nodeRadius)
            .style('fill', d => this.getNodeColor(d))
            .style('stroke', '#fff')
            .style('stroke-width', 2);

        // 添加怀疑度指示环
        nodeEnter.append('circle')
            .attr('class', 'suspicion-ring')
            .attr('r', this.config.nodeRadius + 3)
            .style('fill', 'none')
            .style('stroke', '#e74c3c')
            .style('stroke-width', 3)
            .style('opacity', d => d.suspicion / 100);

        // 添加节点文本
        nodeEnter.append('text')
            .attr('dy', this.config.nodeRadius + 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#2c3e50')
            .text(d => d.name);

        // 添加角色标签
        nodeEnter.append('text')
            .attr('dy', this.config.nodeRadius + 28)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#7f8c8d')
            .text(d => this.getRoleText(d.role));

        // 合并选择
        this.nodeSelection = nodeEnter.merge(nodeSelection);

        // 更新怀疑度指示环
        this.nodeSelection.select('.suspicion-ring')
            .style('opacity', d => d.suspicion / 100);

        // 绑定事件
        this.bindNodeEvents();
    }

    /**
     * 获取节点颜色
     * @param {Object} node - 节点数据
     * @returns {string} 颜色值
     */
    getNodeColor(node) {
        return this.config.colors[node.role] || this.config.colors.default;
    }

    /**
     * 获取角色文本
     * @param {string} role - 角色类型
     * @returns {string} 角色文本
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
     * 绑定节点事件
     */
    bindNodeEvents() {
        this.nodeSelection
            .on('click', (event, d) => {
                event.stopPropagation();
                this.handleNodeClick(d);
            })
            .on('mouseenter', (event, d) => {
                this.handleNodeHover(d, true, event);
            })
            .on('mouseleave', (event, d) => {
                this.handleNodeHover(d, false, event);
            });
    }

    /**
     * 处理节点点击
     * @param {Object} node - 节点数据
     */
    handleNodeClick(node) {
        // 高亮相关节点和连线
        this.highlightRelatedNodes(node);

        // 触发回调
        if (this.onNodeClick) {
            this.onNodeClick(node);
        }

        console.log('节点点击:', node.name);
    }

    /**
     * 处理节点悬停
     * @param {Object} node - 节点数据
     * @param {boolean} isEnter - 是否进入
     * @param {Event} event - 鼠标事件
     */
    handleNodeHover(node, isEnter, event) {
        // 防止事件冒泡影响节点位置
        if (event) {
            event.stopPropagation();
        }

        if (isEnter) {
            // 显示详细信息
            this.showNodeTooltip(node, event);
        } else {
            // 隐藏详细信息
            this.hideNodeTooltip();
        }

        // 触发回调
        if (this.onNodeHover) {
            this.onNodeHover(node, isEnter);
        }
    }

    /**
     * 高亮相关节点和连线
     * @param {Object} targetNode - 目标节点
     */
    highlightRelatedNodes(targetNode) {
        // 重置所有样式
        this.nodeSelection
            .style('opacity', 0.3);

        this.linkSelection
            .style('opacity', 0.1);

        // 高亮目标节点
        this.nodeSelection
            .filter(d => d.id === targetNode.id)
            .style('opacity', 1);

        // 高亮相关连线和节点
        const relatedNodeIds = new Set([targetNode.id]);

        this.linkSelection
            .filter(d => d.source.id === targetNode.id || d.target.id === targetNode.id)
            .style('opacity', 0.8)
            .each(d => {
                relatedNodeIds.add(d.source.id);
                relatedNodeIds.add(d.target.id);
            });

        this.nodeSelection
            .filter(d => relatedNodeIds.has(d.id))
            .style('opacity', 1);
    }

    /**
     * 清除高亮
     */
    clearHighlight() {
        this.nodeSelection.style('opacity', 1);
        this.linkSelection.style('opacity', 0.6);
    }

    /**
     * 显示节点提示框
     * @param {Object} node - 节点数据
     * @param {Event} event - 鼠标事件
     */
    showNodeTooltip(node, event) {
        // 移除现有提示框
        d3.select('.node-tooltip').remove();

        // 获取鼠标位置
        const mouseX = event ? event.pageX : 0;
        const mouseY = event ? event.pageY : 0;

        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'node-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('opacity', 0);

        const content = `
            <strong>${node.name}</strong><br>
            角色: ${this.getRoleText(node.role)}<br>
            怀疑度: ${node.suspicion}%<br>
            年龄: ${node.age || '未知'}
        `;

        tooltip.html(content)
            .style('left', mouseX + 10 + 'px')
            .style('top', mouseY - 10 + 'px')
            .transition()
            .duration(200)
            .style('opacity', 1);
    }

    /**
     * 隐藏节点提示框
     */
    hideNodeTooltip() {
        d3.select('.node-tooltip')
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();
    }

    /**
     * 创建拖拽行为
     */
    createDragBehavior() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    /**
     * 模拟tick事件处理
     */
    tick() {
        // 约束节点位置在可视区域内
        this.nodes.forEach(d => {
            const radius = this.config.nodeRadius;
            d.x = Math.max(radius, Math.min(this.config.width - radius, d.x));
            d.y = Math.max(radius, Math.min(this.config.height - radius, d.y));
        });

        if (this.linkSelection) {
            this.linkSelection
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
        }

        if (this.nodeSelection) {
            this.nodeSelection
                .attr('transform', d => `translate(${d.x},${d.y})`);
        }
    }

    /**
     * 更新怀疑度
     * @param {string} characterId - 角色ID
     * @param {number} suspicionLevel - 怀疑度
     */
    updateSuspicion(characterId, suspicionLevel) {
        const node = this.nodes.find(n => n.id === characterId);
        if (node) {
            node.suspicion = suspicionLevel;

            // 更新怀疑度指示环
            this.nodeSelection
                .filter(d => d.id === characterId)
                .select('.suspicion-ring')
                .transition()
                .duration(500)
                .style('opacity', suspicionLevel / 100);
        }
    }

    /**
     * 重置关系图
     */
    reset() {
        this.nodes = [];
        this.links = [];
        this.clearHighlight();

        if (this.nodeGroup) {
            this.nodeGroup.selectAll('.node').remove();
        }

        if (this.linkGroup) {
            this.linkGroup.selectAll('.link').remove();
        }

        if (this.simulation) {
            this.simulation.stop();
        }
    }

    /**
     * 动态添加新角色到关系图
     * @param {Object} character - 新角色数据
     * @param {Object} suspicionLevels - 当前怀疑度数据
     */
    addCharacter(character, suspicionLevels = {}) {
        // 检查角色是否已存在
        const existingNode = this.nodes.find(n => n.id === character.id);
        if (existingNode) {
            console.log('角色已存在于关系图中:', character.name);
            return;
        }

        // 创建新节点
        const newNode = {
            id: character.id,
            name: character.name,
            role: character.role,
            suspicion: suspicionLevels[character.id] || character.suspicionLevel || 0,
            isNewlyDiscovered: true, // 标记为新发现的角色
            // 设置初始位置在画布中心附近
            x: this.config.width / 2 + (Math.random() - 0.5) * 100,
            y: this.config.height / 2 + (Math.random() - 0.5) * 100,
            ...character
        };

        // 添加到节点数组
        this.nodes.push(newNode);

        // 提取新角色的关系连线
        const newLinks = this.extractCharacterRelationships(character);
        this.links.push(...newLinks);

        // 同时检查现有角色是否有指向新角色的关系
        const reverseLinks = this.extractReverseRelationships(character);
        this.links.push(...reverseLinks);

        // 重新渲染关系图
        this.render();

        // 重新启动力导向模拟以适应新节点
        if (this.simulation) {
            this.simulation.alpha(0.3).restart();
        }

        // 高亮显示新角色
        setTimeout(() => {
            this.highlightNewCharacter(character.id);
        }, 500);

        console.log(`✅ 新角色已添加到关系图: ${character.name}`);
    }

    /**
     * 提取单个角色的关系连线
     * @param {Object} character - 角色数据
     * @returns {Array} 关系连线数据
     */
    extractCharacterRelationships(character) {
        const links = [];

        if (character.relationships) {
            Object.entries(character.relationships).forEach(([targetId, relationship]) => {
                // 检查目标角色是否存在于当前节点中
                const targetExists = this.nodes.some(n => n.id === targetId);

                if (targetExists) {
                    // 避免重复连线
                    const existingLink = this.links.find(link =>
                        (link.source === character.id && link.target === targetId) ||
                        (link.source === targetId && link.target === character.id)
                    );

                    if (!existingLink) {
                        links.push({
                            source: character.id,
                            target: targetId,
                            relationship: relationship,
                            type: this.getRelationshipType(relationship)
                        });
                    }
                }
            });
        }

        return links;
    }

    /**
     * 提取指向新角色的反向关系
     * @param {Object} newCharacter - 新角色数据
     * @returns {Array} 反向关系连线数据
     */
    extractReverseRelationships(newCharacter) {
        const links = [];

        // 检查现有角色是否有指向新角色的关系
        this.nodes.forEach(existingNode => {
            if (existingNode.id !== newCharacter.id && existingNode.relationships) {
                Object.entries(existingNode.relationships).forEach(([targetId, relationship]) => {
                    if (targetId === newCharacter.id) {
                        // 避免重复连线
                        const existingLink = this.links.find(link =>
                            (link.source === existingNode.id && link.target === newCharacter.id) ||
                            (link.source === newCharacter.id && link.target === existingNode.id)
                        );

                        if (!existingLink) {
                            links.push({
                                source: existingNode.id,
                                target: newCharacter.id,
                                relationship: relationship,
                                type: this.getRelationshipType(relationship)
                            });
                        }
                    }
                });
            }
        });

        return links;
    }

    /**
     * 高亮显示新发现的角色
     * @param {string} characterId - 角色ID
     */
    highlightNewCharacter(characterId) {
        if (!this.nodeSelection) return;

        const nodeElement = this.nodeSelection.filter(d => d.id === characterId);
        if (!nodeElement.empty()) {
            // 添加高亮效果
            nodeElement.select('circle')
                .transition()
                .duration(1000)
                .attr('stroke', '#e67e22')
                .attr('stroke-width', 4)
                .transition()
                .duration(1000)
                .attr('stroke', d => this.config.colors[d.role] || this.config.colors.default)
                .attr('stroke-width', 2);

            // 添加脉冲动画类
            nodeElement.select('circle')
                .classed('newly-discovered', true);

            // 3秒后移除新发现标记
            setTimeout(() => {
                const node = this.nodes.find(n => n.id === characterId);
                if (node) {
                    node.isNewlyDiscovered = false;
                }
                nodeElement.select('circle').classed('newly-discovered', false);
            }, 3000);
        }
    }

    /**
     * 销毁关系图
     */
    destroy() {
        this.reset();

        if (this.svg) {
            this.svg.remove();
        }

        this.hideNodeTooltip();
    }

    /**
     * 显示空状态
     */
    showEmptyState() {
        // 清除现有内容
        if (this.nodeGroup) {
            this.nodeGroup.selectAll('.node').remove();
        }
        if (this.linkGroup) {
            this.linkGroup.selectAll('.link').remove();
        }

        // 显示空状态提示
        if (this.graphContainer) {
            let emptyText = this.graphContainer.select('.empty-state');
            if (emptyText.empty()) {
                emptyText = this.graphContainer.append('text')
                    .attr('class', 'empty-state')
                    .attr('x', this.config.width / 2)
                    .attr('y', this.config.height / 2)
                    .attr('text-anchor', 'middle')
                    .style('fill', '#7f8c8d')
                    .style('font-size', '14px')
                    .text('暂无角色关系数据');
            }
        }
    }
}

// 导出类
window.RelationshipGraph = RelationshipGraph;
