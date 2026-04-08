# AI 推理游戏

一个基于大模型的交互式推理游戏 Web 应用。项目结合 DeepSeek 的文本生成能力与通义万相的图片生成能力，为玩家提供“生成案件 -> 与角色对话 -> 搜集线索 -> 推理结案”的完整体验。

本项目目前已经实现前后端联动、剧本生成、角色扮演、多模态图片生成、作家风格检索、游戏进度保存等核心功能，适合作为 AI 应用开发、LLM 产品原型或课程项目展示。

## 项目亮点

- 基于 `Node.js + Express` 搭建后端服务，统一代理大模型与图像模型请求。
- 基于 `HTML + CSS + JavaScript` 实现前端交互，无需额外前端构建工具即可运行。
- 接入 `DeepSeek` 完成推理剧本生成、角色对话、推理链提取等核心文本能力。
- 接入 `阿里云通义万相` 实现场景图与角色肖像的异步图片生成。
- 支持作家风格选择，围绕 5 位经典推理作家构建轻量级风格知识库。
- 使用 `MongoDB + Mongoose` 存储作家风格数据，并通过向量生成与余弦相似度检索实现风格匹配。
- 支持游戏自动保存、线索发现、对话记录、隐藏角色解锁、进度更新等玩法机制。

## 核心功能

### 1. AI 剧本生成

用户可以选择：

- 游戏类型：经典推理、现代悬疑、历史谜案、奇幻推理
- 游戏风格：黑色电影、温馨推理、惊悚悬疑、侦探小说
- 自定义案件描述
- 可选作家风格

系统会调用 DeepSeek 生成结构化 JSON 剧本，内容包括：

- 案件标题、背景、地点
- 初始角色与隐藏角色
- 线索列表
- 真相与时间线

### 2. 角色对话与调查

游戏生成完成后，玩家可以：

- 与不同角色进行多轮对话
- 获取角色回复中的新线索
- 逐步解锁隐藏角色
- 记录对话历史
- 更新怀疑度与调查进展

### 3. 多模态图片生成

系统通过通义万相生成：

- 案发现场图片
- 人物肖像图片
- 与剧情氛围匹配的视觉素材

后端对图片生成任务做了异步提交与轮询处理，前端可展示生成进度。

### 4. 作家风格检索

项目内置 5 位经典推理作家的风格数据：

- 阿瑟·柯南·道尔
- 阿加莎·克里斯蒂
- 埃德加·爱伦·坡
- 雷蒙德·钱德勒
- 东野圭吾

系统会将作家风格特征进行向量化，并结合余弦相似度进行检索，用于辅助生成更具风格一致性的推理剧本。

### 5. 游戏存档与状态管理

当前项目支持：

- 自动保存当前游戏
- 手动保存/加载/删除游戏
- 记录线索发现与对话历史
- 存储游戏阶段与调查进度

当前游戏数据主要保存在本地 `data/games/*.json` 文件中。

## 技术栈

### 前端

- HTML5
- CSS3
- Vanilla JavaScript

### 后端

- Node.js
- Express
- body-parser
- cors
- dotenv
- axios

### 数据与模型

- MongoDB
- Mongoose
- DeepSeek API
- 阿里云通义万相 API

## 项目结构

```text
ai推理游戏/
├── index.html                 # 应用入口页面
├── css/                       # 页面样式
├── js/
│   ├── apis/                  # DeepSeek / 通义万相 API 封装
│   ├── components/            # 对话系统、线索系统、作家选择器等组件
│   ├── controllers/           # 游戏与 UI 控制器
│   ├── bootstrap.js           # 前端模块启动引导
│   ├── config.js              # 全局配置
│   └── main.js                # 前端主入口
├── server/
│   ├── app.js                 # Express 服务入口
│   ├── config/                # 数据库配置
│   ├── models/                # Mongoose 数据模型
│   ├── routes/                # API 路由
│   ├── scripts/               # 初始化与配置测试脚本
│   └── services/              # RAG 与业务服务
├── data/
│   ├── author-styles.json     # 默认作家风格数据
│   └── games/                 # 本地游戏存档目录
├── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

在项目根目录执行：

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件，并填写以下内容：

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-reasoning-game
DEEPSEEK_API_KEY=your_deepseek_api_key
TONGYI_API_KEY=your_tongyi_api_key
```

说明：

- `MONGODB_URI` 用于作家风格数据存储与检索
- `DEEPSEEK_API_KEY` 用于剧本生成、角色对话和风格向量化
- `TONGYI_API_KEY` 用于图片生成

### 3. 测试配置

可以先运行配置测试脚本，检查数据库和 API 是否连通：

```bash
node server/scripts/test-config.js
```

### 4. 初始化作家风格数据

首次运行时，建议先将默认作家风格数据写入 MongoDB：

```bash
node server/scripts/init-authors.js
```

### 5. 启动项目

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

启动成功后，访问：

```text
http://localhost:3000
```

## 主要接口

### 通用接口

- `GET /api/health`：服务健康检查
- `GET /api/config/keys`：读取后端已配置的 API Key 状态
- `POST /api/validate-keys`：验证 DeepSeek / 通义万相密钥

### 模型相关接口

- `POST /api/deepseek/chat`：代理 DeepSeek 对话请求
- `POST /api/tongyi/image`：提交图片生成任务并返回结果
- `GET /api/tongyi/task/:taskId`：查询通义万相任务状态

### 游戏相关接口

- `POST /api/game/save`：保存游戏
- `GET /api/game/load/:gameId`：加载游戏
- `GET /api/game/list`：获取存档列表
- `DELETE /api/game/delete/:gameId`：删除存档
- `PATCH /api/game/progress/:gameId`：更新游戏进度
- `POST /api/game/conversation/:gameId`：保存对话记录
- `POST /api/game/clue/:gameId`：记录新线索

### 作家风格相关接口

- `GET /api/author-style/list`：获取作家风格列表
- `GET /api/author-style/:id`：获取单个作家风格详情
- `POST /api/author-style/search`：检索相似作家风格
- `POST /api/author-style/recommend`：根据游戏类型推荐作家风格
- `POST /api/author-style/generate-prompt`：生成风格化提示词
- `POST /api/author-style/create`：新增作家风格

## 运行流程

1. 用户在前端选择游戏类型、风格和描述
2. 前端调用 DeepSeek 生成结构化推理剧本
3. 系统可选地基于作家风格检索结果增强提示词
4. 前端调用通义万相生成案件与角色图片
5. 游戏控制器初始化线索、角色、怀疑度和游戏阶段
6. 玩家通过对话和调查逐步解锁隐藏信息
7. 游戏状态定期保存到本地 JSON 文件

## 已有实现特点

- 前后端分层相对清晰，便于课程展示和功能扩展
- 前端使用模块化结构组织 API、控制器与组件
- 后端封装了模型调用、配置检查、风格检索与游戏存档逻辑
- 支持从环境变量读取 API 密钥，也支持部分前端本地缓存逻辑
- 具备较完整的异常处理、启动检查和基础恢复机制

## 当前限制与后续可优化方向

### 当前限制

- 当前“RAG”是轻量实现，向量生成与检索逻辑仍较简化
- 作家风格知识库规模较小，目前仅内置 5 位作家
- 游戏主存档目前以本地 JSON 文件方式保存，不是完整数据库持久化
- 前端未引入打包工具或测试框架，工程化程度仍可提升
- 部分模型输出仍依赖提示词约束，稳定性受 API 返回质量影响

### 可优化方向

- 引入更标准的 embedding 模型与向量数据库
- 增强剧本一致性校验与角色设定约束
- 为前端增加更完整的状态管理与组件复用
- 增加 Docker 部署、日志系统和自动化测试
- 增加用户系统、多人协作推理、排行榜等产品化功能

## 演示素材

项目根目录中已包含演示视频文件，可用于答辩、展示或作品集整理：

- `demo精简版.mp4`
- `详细版解说demo.mp4`

## 适用场景

本项目适合用于：

- AI 应用开发课程项目
- 大模型产品原型展示
- 校招/求职作品集展示
- 交互式叙事或 AI 游戏方向实验

## 致谢

本项目使用了以下能力与服务：

- DeepSeek
- 阿里云通义万相
- MongoDB
- Express

如果你准备把这个项目放到 GitHub 或作品集里，建议下一步补充：

- 项目截图
- 演示 GIF / 视频链接
- `.env.example`
- 部署说明
- 你的个人贡献说明
