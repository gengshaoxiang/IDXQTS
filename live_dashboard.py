import streamlit as st
import pandas as pd
import yfinance as yf
import plotly.graph_objects as go
import numpy as np
from streamlit_autorefresh import st_autorefresh
from datetime import datetime
import pytz

# --- 1. 页面配置与自动刷新 ---
st.set_page_config(
    page_title="QuantVision | 实时实盘监控",
    page_icon="⏱️",
    layout="wide"
)

# 每 60,000 毫秒 (60秒) 自动刷新一次页面
count = st_autorefresh(interval=60000, limit=None, key="live_refresh")

# 隐藏多余 UI
hide_streamlit_style = """
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
.stMetric {
    background-color: #1a1a1a;
    border-radius: 8px;
    padding: 15px;
    border-left: 5px solid #00ffcc;
}
.live-badge {
    color: white;
    background-color: red;
    padding: 5px 10px;
    border-radius: 5px;
    font-weight: bold;
    animation: blinker 2s linear infinite;
}
@keyframes blinker {
    50% { opacity: 0; }
}
.alert-box {
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    margin-bottom: 20px;
}
.alert-long { background-color: rgba(0, 255, 0, 0.2); border: 2px solid #00ff00; }
.alert-short { background-color: rgba(255, 0, 0, 0.2); border: 2px solid #ff0000; }
.alert-neutral { background-color: rgba(128, 128, 128, 0.2); border: 2px solid #888; }
</style>
"""
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

# --- 2. 侧边栏配置 ---
with st.sidebar:
    st.markdown("<h1 style='text-align: center;'><span class='live-badge'>🔴 LIVE</span></h1>", unsafe_allow_html=True)
    st.title("实时监控控制台")
    st.caption("基于雅虎金融 1 分钟日内行情")
    st.divider()
    
    # 默认监控我们在回测中表现最好的股票之一：ICBP
    target_stock = st.text_input("输入监控股票代码 (加 .JK)", value="ICBP.JK")
    
    st.markdown("### ⏱️ 日内超短线参数")
    fast_sma = st.slider("短线均线 (分钟)", min_value=3, max_value=20, value=5, step=1)
    slow_sma = st.slider("长线均线 (分钟)", min_value=10, max_value=60, value=15, step=1)
    
    st.divider()
    st.caption(f"当前刷新次数: {count}")

# --- 3. 获取实时数据 ---
@st.cache_data(ttl=30) # 缓存30秒防止雅虎金融反爬限制
def get_live_data(ticker):
    try:
        # 获取当天 1 分钟线
        df = yf.download(ticker, period="1d", interval="1m", progress=False)
        if df.empty:
            return None
        
        # 扁平化多层索引
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [col[0] for col in df.columns]
            
        df.columns = [col.lower() for col in df.columns]
        return df
    except Exception as e:
        st.error(f"数据获取失败: {e}")
        return None

df = get_live_data(target_stock)

# --- 4. 实时信号处理与大屏展示 ---
current_time_jkt = datetime.now(pytz.timezone('Asia/Jakarta')).strftime("%Y-%m-%d %H:%M:%S")

if df is not None and len(df) > slow_sma:
    # 计算日内均线
    df['SMA_Fast'] = df['close'].rolling(window=fast_sma).mean()
    df['SMA_Slow'] = df['close'].rolling(window=slow_sma).mean()
    
    # 计算交叉点
    df['Position'] = np.where(df['SMA_Fast'] > df['SMA_Slow'], 1, -1)
    df['Signal'] = df['Position'].diff() # +2 是金叉(做多)， -2 是死叉(做空)
    
    # 获取最新数据
    latest_row = df.iloc[-1]
    prev_row = df.iloc[-2]
    
    current_price = latest_row['close']
    open_price = df.iloc[0]['open']
    daily_change = ((current_price - open_price) / open_price) * 100
    
    latest_signal = latest_row['Signal']
    
    # 顶部状态栏
    st.markdown(f"### {target_stock.replace('.JK', '')} | 雅加达时间: {current_time_jkt}")
    
    # 警报系统
    if latest_signal == 2:
         st.markdown(f"<div class='alert-box alert-long'><h1>🚨 强烈警报：{fast_sma}分钟/{slow_sma}分钟 发生【金叉做多】！🚨</h1><p>触发价格: Rp {current_price:,.0f}</p></div>", unsafe_allow_html=True)
         st.balloons() # 庆祝特效
    elif latest_signal == -2:
         st.markdown(f"<div class='alert-box alert-short'><h1>🚨 强烈警报：{fast_sma}分钟/{slow_sma}分钟 发生【死叉做空】！🚨</h1><p>触发价格: Rp {current_price:,.0f}</p></div>", unsafe_allow_html=True)
    else:
         st.markdown("<div class='alert-box alert-neutral'><h2>👁️ 持续监控中，目前无新交叉信号。</h2></div>", unsafe_allow_html=True)

    # 核心指标
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric(label="📊 最新价格 (Last)", value=f"Rp {current_price:,.0f}", delta=f"{daily_change:.2f}% (较开盘)")
    with col2:
        st.metric(label="📈 短线均线 (Fast)", value=f"{latest_row['SMA_Fast']:.2f}")
    with col3:
        st.metric(label="📉 长线均线 (Slow)", value=f"{latest_row['SMA_Slow']:.2f}")
    with col4:
        trend = "多头排列 🟢" if latest_row['SMA_Fast'] > latest_row['SMA_Slow'] else "空头排列 🔴"
        st.metric(label="⚖️ 当前趋势", value=trend)

    # 日内交互式 K 线图
    fig = go.Figure()
    
    # 绘制 K 线
    fig.add_trace(go.Candlestick(x=df.index,
                open=df['open'], high=df['high'],
                low=df['low'], close=df['close'],
                name='日内 K 线'))
                
    # 绘制均线
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA_Fast'], mode='lines', name=f'{fast_sma} 分钟均线', line=dict(color='#00ffcc', width=1.5)))
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA_Slow'], mode='lines', name=f'{slow_sma} 分钟均线', line=dict(color='#ff007f', width=1.5)))
    
    # 标记历史交叉点
    buy_signals = df[df['Signal'] == 2]
    sell_signals = df[df['Signal'] == -2]
    
    fig.add_trace(go.Scatter(x=buy_signals.index, y=buy_signals['SMA_Fast'], mode='markers', name='做多信号', 
                             marker=dict(symbol='triangle-up', size=15, color='#00ff00', line=dict(width=2, color='white'))))
    fig.add_trace(go.Scatter(x=sell_signals.index, y=sell_signals['SMA_Fast'], mode='markers', name='做空信号', 
                             marker=dict(symbol='triangle-down', size=15, color='#ff0000', line=dict(width=2, color='white'))))

    # 去除周末和非交易时间间隔 (对于1分钟线，Plotly默认会跳过空隙，但设置 type='category' 可以更紧凑)
    fig.update_layout(
        title=f"日内 1 分钟走势实时监控 (最后更新: {df.index[-1].strftime('%H:%M:%S')} UTC)",
        template="plotly_dark",
        height=650,
        xaxis_rangeslider_visible=False,
        margin=dict(l=0, r=0, t=40, b=0),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    
    st.plotly_chart(fig, use_container_width=True)

else:
    st.warning(f"目前无法获取 {target_stock} 的日内数据，可能印尼股市尚未开盘或处于周末。系统每 60 秒将自动重试...")
    st.markdown(f"当前雅加达时间: {current_time_jkt}")
