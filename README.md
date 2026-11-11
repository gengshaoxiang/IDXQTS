# Captain Lab · 个人数字工程与自研应用总仓

本仓库采用**多项目独立分仓（Monorepo）**目录规范，按独立子文件夹隔离不同技术栈与业务领域的自研系统，互不干扰、统一归档。

## 项目目录总览

| 文件夹 | 项目名称 | 定位与核心能力 | 技术栈 |
| --- | --- | --- | --- |
| [`hangyu-workbench/`](./hangyu-workbench) | **航屿 (Hangyu OS)** | 个人战略与人生工作台（Bento 主工作台、战略项目、日知 14 栏、双链笔记、汇率量化、人生罗盘 8 维雷达、工具箱） | React 19 + TypeScript + Vite + Tailwind CSS |
| [`idxqts/`](./idxqts) | **QuantVision (IDXQTS)** | 印尼证券交易所（IDX · LQ45）双均线历史回测、参数寻优与分钟级实时雷达监控系统 | Python + Streamlit + Pandas + Plotly + yfinance |

## 目录结构规范

```text
.
├── hangyu-workbench/         # 独立项目一：航屿个人战略与人生工作台
│   ├── src/                  # 前端核心组件、11 大业务舱室与本地存储引擎
│   ├── package.json          # 前端依赖与构建脚本
│   └── README.md             # 航屿项目专属文档
├── idxqts/                   # 独立项目二：印尼 LQ45 量化交易与实时监控系统
│   ├── dashboard.py          # 历史回测可视化面板
│   ├── live_dashboard.py     # 单股日内实时监控面板
│   ├── live_scanner.py       # 多目标全景扫描雷达
│   ├── advanced_backtest.py  # PE 基本面筛选 + 网格参数寻优
│   ├── batch_backtest.py     # 批量 RSI 过滤回测
│   ├── download_lq45.py      # 历史行情抓取与清洗
│   ├── requirements.txt      # Python 依赖清单
│   └── README.md             # IDXQTS 量化系统专属文档
├── .gitignore                # 全局忽略规则（隔离缓存、数据集、构建产物与环境变量）
└── README.md                 # 总仓导航与目录治理规范
```

## 快速启动指南

### 1. 启动「航屿 (Hangyu OS)」人生工作台

```bash
cd hangyu-workbench
npm install
npm run dev
```

### 2. 启动「QuantVision (IDXQTS)」印尼量化系统

```bash
cd idxqts
pip install -r requirements.txt
streamlit run live_scanner.py --server.port 8503
```

## 新增项目扩展规范

后续在本仓库新增独立项目时，建议遵循统一短横线小写目录命名（`kebab-case`），例如：

- `rizhi-reader/`：日知 14 栏每日订阅阅读站与移动端应用
- `agent-workflows/`：企业与个人自动化 Agent 脚本与集成工具
- `espresso-lab/`：意式浓缩调豆与器物工具实验台

每个子文件夹内保持独立的依赖描述文件（如 `package.json` 或 `requirements.txt`）与专属 `README.md`。
