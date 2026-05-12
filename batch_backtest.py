import pandas as pd
import numpy as np
import os
import glob

def calculate_rsi(series, period=14):
    """
    计算 RSI 指标
    """
    delta = series.diff()
    # 分离上涨和下跌
    gain = (delta.where(delta > 0, 0)).fillna(0)
    loss = (-delta.where(delta < 0, 0)).fillna(0)
    
    # 计算指数移动平均 (EMA) 会更标准，这里为了简便使用简单移动平均 (SMA)
    # 标准 RSI 使用的是 Wilder 的平滑移动平均，这里我们使用 rolling mean 作为一个近似
    avg_gain = gain.rolling(window=period, min_periods=1).mean()
    avg_loss = loss.rolling(window=period, min_periods=1).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def run_strategy(csv_path, fast_period=20, slow_period=50, rsi_period=14, rsi_threshold=50, commission_rate=0.0015, slippage_rate=0.0005, initial_capital=100000000):
    """
    执行带有手续费、滑点和 RSI 过滤的回测
    """
    df = pd.read_csv(csv_path, parse_dates=['date'])
    df.set_index('date', inplace=True)
    
    if len(df) < slow_period:
        return None

    # --- 1. 计算指标 ---
    df['SMA_Fast'] = df['close'].rolling(window=fast_period).mean()
    df['SMA_Slow'] = df['close'].rolling(window=slow_period).mean()
    df['RSI'] = calculate_rsi(df['close'], period=rsi_period)

    # --- 2. 生成信号 (带 RSI 过滤) ---
    df['Signal'] = 0.0
    
    # 买入条件：短线穿过长线 (多头排列) 且 RSI 大于 50 (动能向上)
    buy_condition = (df['SMA_Fast'] > df['SMA_Slow']) & (df['RSI'] > rsi_threshold)
    df.loc[buy_condition, 'Signal'] = 1.0
    
    # 卖出条件：短线跌破长线 (空头排列)
    sell_condition = (df['SMA_Fast'] < df['SMA_Slow'])
    df.loc[sell_condition, 'Signal'] = 0.0
    
    # 我们不仅需要在买卖点生成信号，信号还代表了每天的持仓状态。
    # 这里我们使用前向填充让 1(持仓) 保持下去，直到遇到 0(清仓)
    # 更严谨的向量化做法：
    df['Position'] = np.nan
    df.loc[buy_condition, 'Position'] = 1.0
    df.loc[sell_condition, 'Position'] = 0.0
    df['Position'] = df['Position'].ffill().fillna(0.0) # 填充持仓状态

    # 实际执行总是滞后一天 (今天收盘出信号，明天开盘/收盘执行)
    df['Actual_Position'] = df['Position'].shift(1).fillna(0.0)

    # --- 3. 计算交易成本 ---
    # 发生交易：持仓状态发生变化时
    df['Trades'] = df['Actual_Position'].diff().fillna(0.0).abs()
    
    # 总交易成本率 = (手续费 + 滑点) * 交易次数 (买和卖各算一次)
    total_cost_rate = commission_rate + slippage_rate
    
    # 每日收益率
    df['Market_Return'] = df['close'].pct_change().fillna(0.0)
    
    # 策略每日收益 = 每日持仓 * 市场收益 - 交易产生的成本
    df['Strategy_Return'] = (df['Actual_Position'] * df['Market_Return']) - (df['Trades'] * total_cost_rate)

    # --- 4. 统计资金曲线 ---
    df['Market_Equity'] = initial_capital * (1 + df['Market_Return']).cumprod()
    df['Strategy_Equity'] = initial_capital * (1 + df['Strategy_Return']).cumprod()

    # --- 5. 计算评价指标 ---
    total_market_return = (df['Market_Equity'].iloc[-1] / initial_capital) - 1
    total_strategy_return = (df['Strategy_Equity'].iloc[-1] / initial_capital) - 1
    
    # 最大回撤
    df['Peak'] = df['Strategy_Equity'].cummax()
    max_drawdown = ((df['Strategy_Equity'] - df['Peak']) / df['Peak']).min()
    
    # 总交易次数
    total_trades = df['Trades'].sum() / 2  # 一买一卖算一次完整交易

    ticker = os.path.basename(csv_path).replace('.csv', '')
    
    return {
        'Ticker': ticker,
        'Market_Return(%)': total_market_return * 100,
        'Strategy_Return(%)': total_strategy_return * 100,
        'Alpha(%)': (total_strategy_return - total_market_return) * 100,
        'Max_Drawdown(%)': max_drawdown * 100,
        'Total_Trades': int(total_trades)
    }

if __name__ == "__main__":
    data_dir = "lq45_data"
    csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
    
    if not csv_files:
        print(f"在 {data_dir} 找不到数据文件。")
        exit()

    print("=== 开始批量回测 LQ45 股票 ===")
    print("策略: 双均线(20,50) + RSI(>50) 多头过滤")
    print("交易成本: 双边千分之1.5手续费 + 万分之5滑点 (单边合计 0.2%)")
    print("-" * 60)
    
    results = []
    for file in csv_files:
        res = run_strategy(file)
        if res:
            results.append(res)
            
    # 将结果转换为 DataFrame 以便清晰展示
    summary_df = pd.DataFrame(results)
    
    # 按照策略收益率降序排列
    summary_df.sort_values(by='Strategy_Return(%)', ascending=False, inplace=True)
    
    # 格式化输出
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    pd.options.display.float_format = '{:.2f}'.format
    
    print(summary_df.to_string(index=False))
    
    # 统计有多少只股票策略跑赢了基准 (Alpha > 0)
    win_market_count = len(summary_df[summary_df['Alpha(%)'] > 0])
    total_count = len(summary_df)
    print("-" * 60)
    print(f"总结: 在 {total_count} 只股票中，有 {win_market_count} 只股票策略跑赢了无脑持有。")
    print(f"胜率 (跑赢基准): {win_market_count / total_count * 100:.2f}%")
    
    # 保存结果
    output_file = "batch_backtest_summary.csv"
    summary_df.to_csv(output_file, index=False)
    print(f"\n详细报告已保存至: {output_file}")
