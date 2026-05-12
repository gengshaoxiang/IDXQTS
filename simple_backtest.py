import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt

def run_moving_average_crossover_backtest(csv_path, fast_period=20, slow_period=50, initial_capital=100000000):
    """
    使用双均线交叉策略进行简单的向量化回测
    :param csv_path: 股票 CSV 数据文件路径
    :param fast_period: 短期均线窗口
    :param slow_period: 长期均线窗口
    :param initial_capital: 初始资金 (默认 1 亿印尼盾)
    """
    print(f"=== 开始回测: {os.path.basename(csv_path)} ===")
    
    # 1. 加载数据
    try:
        df = pd.read_csv(csv_path, parse_dates=['date'])
        df.set_index('date', inplace=True)
    except Exception as e:
        print(f"读取数据失败: {e}")
        return

    # 2. 计算指标 (双均线)
    df['SMA_Fast'] = df['close'].rolling(window=fast_period).mean()
    df['SMA_Slow'] = df['close'].rolling(window=slow_period).mean()

    # 3. 生成交易信号 (Signal)
    # 1 表示多头持仓，0 表示空仓
    # np.where(条件, 满足时的值, 不满足时的值)
    df['Signal'] = 0.0
    # 当短期均线大于长期均线时，看多
    df.loc[df['SMA_Fast'] > df['SMA_Slow'], 'Signal'] = 1.0
    
    # 计算实际的持仓指令 (Position)，需要将信号往后移一天
    # 因为我们只能在今天收盘看到交叉，明天开盘才能执行买入
    df['Position'] = df['Signal'].shift(1)

    # 4. 计算收益率
    # 股票每日基准收益率
    df['Market_Return'] = df['close'].pct_change()
    # 策略每日收益率 = 昨天的持仓状态 * 今天的股票收益率
    df['Strategy_Return'] = df['Position'] * df['Market_Return']

    # 5. 计算累计收益 (资金曲线)
    # 使用累乘计算资金净值
    df['Market_Equity'] = initial_capital * (1 + df['Market_Return']).cumprod()
    df['Strategy_Equity'] = initial_capital * (1 + df['Strategy_Return']).cumprod()

    # 去除由于计算均线产生的 NaN 行
    df.dropna(inplace=True)

    # 6. 统计回测结果
    total_market_return = (df['Market_Equity'].iloc[-1] / initial_capital) - 1
    total_strategy_return = (df['Strategy_Equity'].iloc[-1] / initial_capital) - 1
    
    # 计算年化收益率 (假设每年252个交易日)
    days = (df.index[-1] - df.index[0]).days
    years = days / 365.25
    annualized_strategy_return = (1 + total_strategy_return) ** (1 / years) - 1
    annualized_market_return = (1 + total_market_return) ** (1 / years) - 1

    # 计算最大回撤 (Max Drawdown)
    df['Peak'] = df['Strategy_Equity'].cummax()
    df['Drawdown'] = (df['Strategy_Equity'] - df['Peak']) / df['Peak']
    max_drawdown = df['Drawdown'].min()

    # 打印结果
    print(f"策略参数: {fast_period}日均线 / {slow_period}日均线")
    print(f"回测区间: {df.index[0].date()} 到 {df.index[-1].date()}")
    print("-" * 30)
    print(f"【基准(一直持有)总收益】: {total_market_return * 100:.2f}%")
    print(f"【策略总收益】         : {total_strategy_return * 100:.2f}%")
    print(f"【基准年化收益】       : {annualized_market_return * 100:.2f}%")
    print(f"【策略年化收益】       : {annualized_strategy_return * 100:.2f}%")
    print(f"【策略最大回撤】       : {max_drawdown * 100:.2f}%\n")

    # 7. 绘制资金曲线对比图并保存
    plt.figure(figsize=(12, 6))
    plt.plot(df.index, df['Market_Equity'], label='Buy & Hold (Market)', color='gray', alpha=0.7)
    plt.plot(df.index, df['Strategy_Equity'], label='Strategy Equity', color='blue')
    plt.title(f"{os.path.basename(csv_path)} - Strategy vs Market")
    plt.xlabel('Date')
    plt.ylabel('Capital (IDR)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # 保存图片
    image_name = f"backtest_result_{os.path.basename(csv_path).replace('.csv', '')}.png"
    plt.savefig(image_name)
    print(f"已生成资金曲线图: {image_name}")

if __name__ == "__main__":
    # 以印尼最大的银行 BBCA (Bank Central Asia) 为例进行回测
    target_file = os.path.join("lq45_data", "BBCA.csv")
    
    if os.path.exists(target_file):
        # 初始资金 1 亿印尼盾
        run_moving_average_crossover_backtest(target_file, fast_period=20, slow_period=50, initial_capital=100000000)
    else:
        print(f"找不到文件: {target_file}，请先确保数据下载成功。")
