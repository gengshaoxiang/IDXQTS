import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
import os

# --- 1. 页面设置与样式 ---
st.set_page_config(
    page_title="QuantVision | LQ45 量化看盘面板",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 隐藏 Streamlit 默认菜单和页脚，提升高级感
hide_streamlit_style = """
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
.stMetric {
    background-color: #1E1E1E;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
</style>
"""
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

# --- 2. 数据加载 ---
@st.cache_data
def load_optimization_results():
    try:
        df = pd.pd.read_csv("advanced_optimization_results.csv")
    except:
        df = pd.read_csv("advanced_optimization_results.csv")
    return df

@st.cache_data
def load_stock_data(ticker):
    file_path = os.path.join("lq45_data", f"{ticker}.csv")
    if os.path.exists(file_path):
        df = pd.read_csv(file_path, parse_dates=['date'])
        df.set_index('date', inplace=True)
        return df
    return None

def calculate_strategy(df, fast_period, slow_period, commission_rate=0.0015, slippage_rate=0.0005):
    """实时重新计算策略收益与信号"""
    if df is None or len(df) < slow_period:
        return None
    
    data = df.copy()
    data['SMA_Fast'] = data['close'].rolling(window=fast_period).mean()
    data['SMA_Slow'] = data['close'].rolling(window=slow_period).mean()
    
    data['Position'] = np.where(data['SMA_Fast'] > data['SMA_Slow'], 1.0, -1.0)
    data['Actual_Position'] = data['Position'].shift(1).fillna(0.0)
    data['Trades'] = data['Actual_Position'].diff().fillna(0.0).abs()
    
    total_cost_rate = commission_rate + slippage_rate
    data['Market_Return'] = data['close'].pct_change().fillna(0.0)
    data['Strategy_Return'] = (data['Actual_Position'] * data['Market_Return']) - (data['Trades'] * total_cost_rate)
    
    data['Market_Equity'] = (1 + data['Market_Return']).cumprod()
    data['Strategy_Equity'] = (1 + data['Strategy_Return']).cumprod()
    
    # 提取买卖信号点 (用于图表)
    # 买入点: 昨天持仓不是 1，今天是 1
    buy_signals = data[(data['Position'] == 1) & (data['Position'].shift(1) != 1)]
    # 卖出点: 昨天持仓不是 -1，今天是 -1
    sell_signals = data[(data['Position'] == -1) & (data['Position'].shift(1) != -1)]
    
    return data, buy_signals, sell_signals

# --- 3. 侧边栏 ---
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/2933/2933116.png", width=60)
    st.title("QuantVision")
    st.markdown("### LQ45 多空回测系统")
    st.divider()
    
    try:
        opt_df = load_optimization_results()
        available_tickers = opt_df['Ticker'].tolist()
    except Exception as e:
        st.error("找不到优化结果文件，请先运行回测脚本。")
        st.stop()
        
    selected_ticker = st.selectbox("选择交易标的", available_tickers)
    
    # 获取选定股票的历史最优参数
    best_row = opt_df[opt_df['Ticker'] == selected_ticker].iloc[0]
    default_fast = int(best_row['Best_Fast_SMA'])
    default_slow = int(best_row['Best_Slow_SMA'])
    
    st.markdown("### ⚙️ 参数微调")
    st.caption("拖动滑块实时重算资金曲线")
    fast_sma = st.slider("Fast SMA 周期", min_value=5, max_value=30, value=default_fast, step=1)
    slow_sma = st.slider("Slow SMA 周期", min_value=20, max_value=100, value=default_slow, step=1)
    
    if fast_sma >= slow_sma:
        st.error("⚠️ 短期均线周期必须小于长期均线")

# --- 4. 核心计算 ---
stock_data = load_stock_data(selected_ticker)
result = calculate_strategy(stock_data, fast_sma, slow_sma)

if result:
    processed_data, buy_sig, sell_sig = result
    
    total_market_return = (processed_data['Market_Equity'].iloc[-1] - 1) * 100
    total_strategy_return = (processed_data['Strategy_Equity'].iloc[-1] - 1) * 100
    
    # --- 5. 顶部 KPI 区 ---
    st.title(f"📊 {selected_ticker} 量化分析面板")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric(label="📊 无脑持有总收益", value=f"{total_market_return:.2f}%")
    with col2:
        # 如果策略收益超越基准，显示绿色箭头
        delta = total_strategy_return - total_market_return
        st.metric(label="🤖 多空策略总收益", value=f"{total_strategy_return:.2f}%", delta=f"{delta:.2f}% 超额")
    with col3:
        st.metric(label="⚙️ 当前选用参数", value=f"{fast_sma} / {slow_sma}")
    with col4:
        st.metric(label="📈 网格搜索历史最优", value=f"{default_fast} / {default_slow}")
        
    st.divider()

    # --- 6. 交互式图表区 ---
    tab1, tab2 = st.tabs(["📉 动态 K 线与信号", "📈 资金权益对比曲线"])
    
    with tab1:
        # Plotly Candlestick with Signals
        fig_price = go.Figure()
        
        # 考虑到 Streamlit 性能，如果不展示 K线可以展示收盘价折线
        fig_price.add_trace(go.Scatter(x=processed_data.index, y=processed_data['close'], 
                                       mode='lines', name='Close Price', line=dict(color='gray', width=1.5), opacity=0.6))
        
        fig_price.add_trace(go.Scatter(x=processed_data.index, y=processed_data['SMA_Fast'], 
                                       mode='lines', name=f'SMA {fast_sma}', line=dict(color='#00ffcc', width=2)))
                                       
        fig_price.add_trace(go.Scatter(x=processed_data.index, y=processed_data['SMA_Slow'], 
                                       mode='lines', name=f'SMA {slow_sma}', line=dict(color='#ff007f', width=2)))
        
        # 添加做多信号 (绿色向上三角形)
        fig_price.add_trace(go.Scatter(x=buy_sig.index, y=buy_sig['SMA_Fast'], 
                                       mode='markers', name='Buy/Long Signal', 
                                       marker=dict(symbol='triangle-up', size=12, color='#00ff00', line=dict(width=1, color='black'))))
                                       
        # 添加做空信号 (红色向下三角形)
        fig_price.add_trace(go.Scatter(x=sell_sig.index, y=sell_sig['SMA_Fast'], 
                                       mode='markers', name='Sell/Short Signal', 
                                       marker=dict(symbol='triangle-down', size=12, color='#ff0000', line=dict(width=1, color='black'))))
        
        fig_price.update_layout(
            title=f"{selected_ticker} 价格走势与均线交叉点",
            template="plotly_dark",
            height=600,
            hovermode="x unified",
            margin=dict(l=0, r=0, t=40, b=0),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig_price, use_container_width=True)
        
    with tab2:
        # Plotly Equity Curve
        fig_eq = go.Figure()
        fig_eq.add_trace(go.Scatter(x=processed_data.index, y=processed_data['Market_Equity'], 
                                    mode='lines', name='Buy & Hold Equity', line=dict(color='#888888', dash='dash')))
        fig_eq.add_trace(go.Scatter(x=processed_data.index, y=processed_data['Strategy_Equity'], 
                                    mode='lines', name='Strategy Equity', line=dict(color='#00ffcc', width=3)))
        
        # 高亮回撤区域 (Optional: 可以计算 peak 并填充 drawdowns)
        
        fig_eq.update_layout(
            title=f"{selected_ticker} 累计净值走势",
            template="plotly_dark",
            height=600,
            hovermode="x unified",
            yaxis_title="Equity (Base 1.0)",
            margin=dict(l=0, r=0, t=40, b=0),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig_eq, use_container_width=True)

    # --- 7. 数据底表 ---
    st.markdown("### 📋 全市场参数优化总榜单")
    st.dataframe(opt_df.style.highlight_max(subset=['Max_Long_Short_Return(%)'], color='green', axis=0), use_container_width=True)

else:
    st.warning("数据加载失败或数据不足。")
