import streamlit as st
import pandas as pd
import yfinance as yf
import numpy as np
from streamlit_autorefresh import st_autorefresh
from datetime import datetime
import pytz
import math

# --- 1. 页面配置与自动刷新 ---
st.set_page_config(
    page_title="QuantVision | 多目标全景雷达 (实战版)",
    page_icon="📡",
    layout="wide"
)

# 每 60,000 毫秒 (60秒) 自动刷新一次
count = st_autorefresh(interval=60000, limit=None, key="scanner_refresh")

# 隐藏默认UI并设置自定义样式
custom_css = """
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
.alert-card {
    background-color: #1e1e1e;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.5);
    margin-bottom: 20px;
    animation: flash 1.5s infinite alternate;
}
.alert-long { border: 3px solid #00ff00; }
.alert-short { border: 3px solid #ff0000; }
@keyframes flash {
    0% { opacity: 1; }
    100% { opacity: 0.7; }
}
.metric-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #333;
}
.up-text { color: #00ffcc; font-weight: bold; }
.down-text { color: #ff007f; font-weight: bold; }
</style>
"""
st.markdown(custom_css, unsafe_allow_html=True)

# 默认监控池
DEFAULT_POOL = ["ICBP.JK", "ASII.JK", "BMRI.JK", "BBNI.JK", "BBCA.JK", "ADRO.JK", "INDF.JK", "BBRI.JK", "TLKM.JK"]

# --- 2. 侧边栏配置 ---
with st.sidebar:
    st.title("📡 全景雷达控制台")
    st.caption("基于雅虎金融 1 分钟日内行情")
    st.divider()
    
    st.markdown("### 💰 仓位与资金管理")
    capital_input = st.number_input("单笔交易预设资金 (IDR)", min_value=1000000, max_value=10000000000, value=10000000, step=1000000, help="当触发买入警报时，系统将根据此金额为您计算建议买入的手数。")
    
    st.divider()
    
    selected_tickers = st.multiselect(
        "构建您的监控池 (建议 < 15 只)",
        options=DEFAULT_POOL + ["GOTO.JK", "UNVR.JK", "AMMN.JK", "BRPT.JK", "PGAS.JK", "ITMG.JK"],
        default=DEFAULT_POOL
    )
    
    st.markdown("### ⏱️ 全局预警规则 (日内)")
    fast_sma = st.slider("短线均线 (分钟)", min_value=3, max_value=20, value=5, step=1)
    slow_sma = st.slider("长线均线 (分钟)", min_value=10, max_value=60, value=15, step=1)
    
    st.divider()
    st.caption(f"当前刷新次数: {count}")

# --- 3. 批量获取与计算数据 ---
@st.cache_data(ttl=30)
def fetch_and_compute_signals(tickers, fast, slow):
    if not tickers:
        return None, []
    
    try:
        tickers_str = " ".join(tickers)
        df = yf.download(tickers_str, period="1d", interval="1m", progress=False)
        
        if df.empty:
            return None, []

        results = []
        
        for ticker in tickers:
            try:
                if len(tickers) == 1:
                    close_series = df['Close']
                    open_series = df['Open']
                else:
                    close_series = df['Close'][ticker]
                    open_series = df['Open'][ticker]
                
                close_series = close_series.dropna()
                if len(close_series) < slow:
                    continue
                
                sma_fast = close_series.rolling(window=fast).mean()
                sma_slow = close_series.rolling(window=slow).mean()
                
                position = np.where(sma_fast > sma_slow, 1, -1)
                signal = np.diff(position, prepend=np.nan)
                
                latest_close = close_series.iloc[-1]
                first_open = open_series.dropna().iloc[0]
                daily_pct = ((latest_close - first_open) / first_open) * 100
                
                latest_fast = sma_fast.iloc[-1]
                latest_slow = sma_slow.iloc[-1]
                latest_signal = signal[-1]
                
                trend_status = "多头 🟢" if latest_fast > latest_slow else "空头 🔴"
                
                alert_type = "None"
                if latest_signal == 2:
                    alert_type = "LONG"
                elif latest_signal == -2:
                    alert_type = "SHORT"
                
                results.append({
                    "Ticker": ticker.replace(".JK", ""),
                    "Last_Price": latest_close,
                    "Change_Pct": daily_pct,
                    "Trend": trend_status,
                    "Alert": alert_type,
                    "Fast_SMA": latest_fast,
                    "Slow_SMA": latest_slow
                })
            except Exception as e:
                continue
                
        return pd.DataFrame(results)
    
    except Exception as e:
        st.error(f"批量获取数据失败: {e}")
        return None

# --- 4. 大屏渲染 ---
st.markdown("<h1><span style='color:red'>🔴 LIVE</span> 多目标量化扫描雷达 (实战版)</h1>", unsafe_allow_html=True)
current_time_jkt = datetime.now(pytz.timezone('Asia/Jakarta')).strftime("%Y-%m-%d %H:%M:%S")
st.markdown(f"**雅加达时间:** `{current_time_jkt}` | 自动轮询中...")

if not selected_tickers:
    st.warning("请在左侧侧边栏添加要监控的股票。")
    st.stop()

with st.spinner("正在扫描全市场分钟级数据..."):
    results_df = fetch_and_compute_signals(selected_tickers, fast_sma, slow_sma)

if results_df is not None and not results_df.empty:
    
    # --- 顶层突发警报中心 ---
    long_alerts = results_df[results_df['Alert'] == 'LONG']
    short_alerts = results_df[results_df['Alert'] == 'SHORT']
    
    has_alerts = not long_alerts.empty or not short_alerts.empty
    
    if has_alerts:
        st.markdown("## 🚨 突发交易指令中心 🚨")
        cols = st.columns(max(len(long_alerts) + len(short_alerts), 1))
        col_idx = 0
        
        for _, row in long_alerts.iterrows():
            lots_to_buy = math.floor(capital_input / (row['Last_Price'] * 100))
            with cols[col_idx]:
                st.markdown(f"""
                <div class="alert-card alert-long">
                    <h2 style='color:#00ff00; margin:0;'>🔔 {row['Ticker']} 准点买入</h2>
                    <h1 style='margin:10px 0;'>Rp {row['Last_Price']:,.0f}</h1>
                    <h3 style='color:#00ffcc;'>建议买入量: {lots_to_buy} 手 (Lot)</h3>
                    <p style='color:#ccc;'>理由: {fast_sma}分钟线 向上突破 {slow_sma}分钟线 (金叉)</p>
                </div>
                """, unsafe_allow_html=True)
            col_idx += 1
            
        for _, row in short_alerts.iterrows():
            with cols[col_idx]:
                st.markdown(f"""
                <div class="alert-card alert-short">
                    <h2 style='color:#ff0000; margin:0;'>🚨 {row['Ticker']} 立即清仓</h2>
                    <h1 style='margin:10px 0;'>Rp {row['Last_Price']:,.0f}</h1>
                    <h3 style='color:#ff7777;'>建议卖出量: 全部已有头寸</h3>
                    <p style='color:#ccc;'>理由: {fast_sma}分钟线 向下突破 {slow_sma}分钟线 (死叉)</p>
                </div>
                """, unsafe_allow_html=True)
            col_idx += 1
        
        st.balloons()
        st.divider()

    # --- 底层常规状态雷达表 ---
    st.markdown("### 🌐 全局监控雷达面板")
    
    display_df = results_df.copy()
    display_df['Last_Price'] = display_df['Last_Price'].apply(lambda x: f"Rp {x:,.0f}")
    
    def highlight_change(val):
        color = '#00ffcc' if val > 0 else '#ff007f' if val < 0 else 'gray'
        return f'color: {color}; font-weight: bold'
        
    styled_df = display_df[['Ticker', 'Last_Price', 'Change_Pct', 'Trend', 'Alert']].style \
        .map(highlight_change, subset=['Change_Pct']) \
        .format({'Change_Pct': "{:+.2f}%"})
        
    st.dataframe(styled_df, use_container_width=True, height=400)

    # --- 底层知识说明区 ---
    st.divider()
    with st.expander("📚 详细操作指南与量化指标说明 (点击展开)"):
        st.markdown("""
        ### 一、操作指南：我该如何使用这个面板？
        本面板设计用于**日内极短线交易 (Day Trading)** 或波段操作的入场点捕捉。系统会自动为您盯盘，您只需保持页面打开即可。
        
        1. **何时预警买入 (金叉信号)**：
           * 当上方出现 **绿色的“🔔 准点买入”** 卡片时，代表系统的监控报警被触发。
           * **买入逻辑**：短期市场动能突然增强，短线均线（Fast SMA）由下往上穿过了长线均线（Slow SMA）。在技术分析中，这被称为“金叉 (Golden Cross)”，意味着多头力量开始占据主导。
        
        2. **买入多少 (资金与仓位管理)**：
           * 在左侧边栏，您需要提前设置好“**单笔交易预设资金**”。
           * 系统会自动读取目标股票当前的实时价格，并根据印尼市场规则（**1手/Lot = 100股**）帮您计算出**精准的买入手数**。公式为：`向下取整(预设资金 / (当前股价 * 100))`。
           * *例如：预设资金为1千万印尼盾，股价为6,000，则系统建议买入 16 手 (16 * 100 * 6000 = 9,600,000)。*
        
        3. **何时预警卖出 (死叉信号)**：
           * 当上方出现 **红色的“🚨 立即清仓”** 卡片时，代表短期趋势已经破位。
           * **卖出逻辑**：短期动能衰竭，空头开始砸盘，短线均线由上往下穿破了长线均线。这被称为“死叉 (Death Cross)”。
        
        4. **卖出多少**：
           * 对于普通印尼散户账户，由于缺乏畅通的日内做空(Short Selling)机制，系统发出的死叉预警被定义为**“多头平仓离场”**信号。
           * 系统建议：**卖出该股票现有的全部已有头寸**，落袋为安，避免进一步回撤。

        ---
        
        ### 二、核心指标详细解释
        
        *   **Fast SMA (短线简单移动平均线)**：
            *   代表过去 N 分钟（默认 5 分钟）股票收盘价的平均值。它对价格变化的反应非常极其灵敏，反映了**当下的瞬时情绪**。
        *   **Slow SMA (长线简单移动平均线)**：
            *   代表过去 M 分钟（默认 15 分钟）的平均价。它反应较慢，起到了平滑噪音的作用，代表了**当天的基础趋势**。
        *   **为什么监控分钟级交叉？**
            *   大级别的牛熊反转往往始于小级别的破位。在日内盯盘时，等待日线级别的交叉太慢了（容易买在半山腰或卖在谷底），使用 5分钟/15分钟级别可以抢先一步吃掉日内的波段利润。
        """)

else:
    st.warning("暂无数据。可能雅虎金融未更新，或者市场处于休市状态。系统将持续重试...")
