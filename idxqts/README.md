# QuantVision (IDXQTS) · 印度尼西亚量化交易与监控系统

QuantVision 是一个专为 **印尼证券交易所 (IDX - LQ45)** 打造的量化交易回测与实时监控系统，集成历史数据回测、参数网格寻优、单股日内追踪与多目标全景雷达扫描四大模块。

## 核心功能架构

1. **历史回测与参数寻优舱 (`dashboard.py`)**
   - 盘后分析，拖动滑块寻找并优化每只股票的最佳双均线交易参数。
   - 基于本地清洗后的日线 CSV 数据，含千分之 1.5 手续费与万分之 5 滑点模拟。
2. **单股深度追踪仪 (`live_dashboard.py`)**
   - 实时日内波段监控（1 分钟级别），直连 `yfinance` 行情并每 60 秒自动刷新。
3. **多目标全景雷达扫描仪 (`live_scanner.py`)**
   - 监控 LQ45 核心自选股池，捕捉短线均线金叉/死叉破位信号并计算建议手数（1 Lot = 100 股）。

## 快速启动

进入本项目目录并安装依赖：

```bash
cd idxqts
pip install -r requirements.txt
```

下载并清洗历史数据（首次回测前执行）：

```bash
python download_lq45.py
python advanced_backtest.py
```

启动可视化面板：

```bash
# 历史回测面板
streamlit run dashboard.py

# 单股日内追踪面板
streamlit run live_dashboard.py --server.port 8502

# 多股全景扫描雷达
streamlit run live_scanner.py --server.port 8503
```

## 目录说明

```text
idxqts/
├── advanced_backtest.py      # 带 PE 过滤和网格搜索的进阶回测引擎
├── batch_backtest.py         # 双均线 + RSI 批量股票回测脚本
├── simple_backtest.py        # 单标的向量化双均线回测脚本
├── download_lq45.py          # LQ45 成分股历史数据自动化抓取与清洗
├── dashboard.py              # 历史回测可视化面板
├── live_dashboard.py         # 单股实时日内追踪面板
├── live_scanner.py           # 多目标全景雷达扫描面板
├── requirements.txt          # Python 依赖清单
└── README.md                 # 项目说明文档
```

## 免责声明

本项目代码仅供量化交易技术研究与交流学习使用，所有信号均基于历史回测模型与均线算法得出，不构成任何投资建议。
