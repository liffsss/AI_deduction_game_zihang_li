const express = require('express');
const axios = require('axios');
const router = express.Router();

// DeepSeek API调用
router.post('/deepseek/chat', async (req, res) => {
    try {
        const { messages, temperature = 0.7, max_tokens = 4000, response_format } = req.body;
        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'DeepSeek API密钥未在服务器配置'
            });
        }
        
        const requestBody = {
            model: 'deepseek-chat',
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens,
            stream: false
        };

        // 如果指定了response_format，添加到请求中
        if (response_format) {
            requestBody.response_format = response_format;
        }

        const response = await axios.post('https://api.deepseek.com/chat/completions', requestBody, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 120000, // 增加到120秒超时
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('DeepSeek API调用失败:', error.response?.data || error.message);
        
        let errorMessage = '调用DeepSeek API失败';
        if (error.response?.status === 401) {
            errorMessage = 'API密钥无效';
        } else if (error.response?.status === 429) {
            errorMessage = 'API调用频率超限，请稍后重试';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '请求超时，请重试';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            details: error.response?.data || error.message
        });
    }
});

// 通义万相API调用 - 异步模式
router.post('/tongyi/image', async (req, res) => {
    try {
        const { prompt, negativePrompt = '', style = '<photography>' } = req.body;
        const apiKey = process.env.TONGYI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: '通义万相API密钥未在服务器配置'
            });
        }

        // 第一步：提交异步任务
        const submitResponse = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
            {
                model: 'wanx-v1',
                input: {
                    prompt: prompt,
                    negative_prompt: negativePrompt,
                    style: style
                },
                parameters: {
                    size: '1024*1024',
                    n: 1
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable'  // 启用异步模式
                },
                timeout: 30000
            }
        );

        const taskId = submitResponse.data.output.task_id;
        console.log('通义万相任务已提交，任务ID:', taskId);

        // 第二步：轮询查询结果
        let attempts = 0;
        const maxAttempts = 60; // 最多等待5分钟

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒

            try {
                const queryResponse = await axios.get(
                    `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`
                        },
                        timeout: 10000
                    }
                );

                const status = queryResponse.data.output.task_status;
                console.log(`任务状态 (${attempts + 1}/${maxAttempts}):`, status);

                if (status === 'SUCCEEDED') {
                    // 任务成功完成
                    res.json({
                        success: true,
                        data: queryResponse.data
                    });
                    return;
                } else if (status === 'FAILED') {
                    // 任务失败
                    throw new Error('图片生成任务失败');
                }
                // 如果状态是 PENDING 或 RUNNING，继续等待

            } catch (queryError) {
                console.error('查询任务状态失败:', queryError.message);
                if (attempts >= maxAttempts - 1) {
                    throw queryError;
                }
            }

            attempts++;
        }

        // 超时
        throw new Error('图片生成超时，请稍后重试');

    } catch (error) {
        console.error('通义万相API调用失败:', error.response?.data || error.message);

        let errorMessage = '调用通义万相API失败';
        if (error.response?.status === 401) {
            errorMessage = 'API密钥无效';
        } else if (error.response?.status === 429) {
            errorMessage = 'API调用频率超限，请稍后重试';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '请求超时，请重试';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            details: error.response?.data || error.message
        });
    }
});

// 查询通义万相任务状态
router.get('/tongyi/task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const apiKey = process.env.TONGYI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: '通义万相API密钥未在服务器配置'
            });
        }

        const response = await axios.get(
            `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 10000
            }
        );

        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('查询任务状态失败:', error.response?.data || error.message);

        res.status(500).json({
            success: false,
            error: '查询任务状态失败',
            details: error.response?.data || error.message
        });
    }
});

// 获取API密钥配置
router.get('/config/keys', (req, res) => {
    try {
        const config = {
            deepseek: process.env.DEEPSEEK_API_KEY || null,
            tongyi: process.env.TONGYI_API_KEY || null
        };

        res.json({
            success: true,
            config: config,
            message: 'API密钥配置获取成功'
        });
    } catch (error) {
        console.error('获取API密钥配置失败:', error);
        res.status(500).json({
            success: false,
            error: '获取API密钥配置失败',
            message: error.message
        });
    }
});

// 健康检查
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API服务正常',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API密钥验证
router.post('/validate-keys', async (req, res) => {
    const { deepseekKey, tongyiKey } = req.body;
    const results = {};
    
    // 验证DeepSeek密钥
    if (deepseekKey) {
        try {
            await axios.post('https://api.deepseek.com/v1/chat/completions', {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            }, {
                headers: {
                    'Authorization': `Bearer ${deepseekKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            results.deepseek = { valid: true, message: 'DeepSeek密钥有效' };
        } catch (error) {
            results.deepseek = { 
                valid: false, 
                message: error.response?.status === 401 ? 'DeepSeek密钥无效' : 'DeepSeek密钥验证失败'
            };
        }
    }
    
    // 验证通义万相密钥
    if (tongyiKey) {
        try {
            await axios.post(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
                {
                    model: 'wanx-v1',
                    input: { prompt: 'test' },
                    parameters: { size: '512*512', n: 1 }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${tongyiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            results.tongyi = { valid: true, message: '通义万相密钥有效' };
        } catch (error) {
            results.tongyi = { 
                valid: false, 
                message: error.response?.status === 401 ? '通义万相密钥无效' : '通义万相密钥验证失败'
            };
        }
    }
    
    res.json({
        success: true,
        results: results
    });
});

// 代理图片下载（解决跨域问题）
router.get('/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: '图片URL未提供'
            });
        }
        
        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 30000
        });
        
        // 设置响应头
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存1天
        
        // 管道传输图片数据
        response.data.pipe(res);
    } catch (error) {
        console.error('代理图片下载失败:', error.message);
        res.status(500).json({
            success: false,
            error: '图片下载失败'
        });
    }
});

// 错误处理中间件
router.use((error, req, res, next) => {
    console.error('API路由错误:', error);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: error.message
    });
});

module.exports = router;
