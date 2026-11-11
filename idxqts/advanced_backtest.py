import pandas as pd
import numpy as np
import yfinance as yf
import os
import glob
import itertools

def get_pe_ratio(ticker_symbol):
    """获取单只股票的 Trailing PE"""
    try:
        info = yf.Ticker(ticker_symbol).info
        return info.get('trailingPE', None)
    except:
        return None

def fundamental_screener(data_dir, max_pe=15.0):
    """
    基本面筛选器：找出 PE 小于指定阈值的股票
    """
    print(f"=== 开始基本面筛选 (PE < {max_pe}) ===")
    csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
    passed_files = []
    
    for file in csv_files:
        basename = os.path.basename(file).replace('.csv', '')
        ticker = f"{basename}.JK"  # 加上 .JK 后缀给 yfinance 识别
        
        pe = get_pe_ratio(ticker)
        
        if pe is not None and pe > 0 and pe < max_pe:
            print(f"[通过] {basename}: PE = {pe:.2f}")
            passed_files.append(file)
        elif pe is None or pe <= 0:
            print(f"[淘汰] {basename}: 无有效 PE 数据 (可能是亏损企业)")
        else:
            print(f"[淘汰] {basename}: PE = {pe:.2f} (估值过高)")
            
    return passed_files

def run_long_short_strategy(csv_path, fast_period, slow_period, commission_rate=0.0015, slippage_rate=0.0005):
    """
    运行多空双向均线策略
    返回：策略总收益率
    """
    df = pd.read_csv(csv_path, parse_dates=['date'])
    df.set_index('date', inplace=True)
    
    if len(df) < slow_period:
        return -999.0 # 数据不足

    # 1. 计算双均线
    df['SMA_Fast'] = df['close'].rolling(window=fast_period).mean()
    df['SMA_Slow'] = df['close'].rolling(window=slow_period).mean()

    # 2. 生成多空信号 (无死角覆盖：金叉做多 1，死叉做空 -1)
    # np.where(条件, 为真时的值, 为假时的值)
    df['Position'] = np.where(df['SMA_Fast'] > df['SMA_Slow'], 1.0, -1.0)
    
    # 实际执行滞后一天
    df['Actual_Position'] = df['Position'].shift(1).fillna(0.0)

    # 3. 计算交易成本
    # 当仓位从 1 变成 -1，差值的绝对值是 2。这正好对应了：平多仓(1份) + 开空仓(1份)
    df['Trades'] = df['Actual_Position'].diff().fillna(0.0).abs()
    total_cost_rate = commission_rate + slippage_rate
    
    # 4. 计算每日收益
    df['Market_Return'] = df['close'].pct_change().fillna(0.0)
    # 多空收益 = 实际持仓 * 市场收益 - 交易成本
    df['Strategy_Return'] = (df['Actual_Position'] * df['Market_Return']) - (df['Trades'] * total_cost_rate)

    # 5. 计算累计收益
    # 初始资金设为 1，直接用 cumprod 计算倍数
    strategy_equity = (1 + df['Strategy_Return']).cumprod()
    
    # 剔除由于均线计算初期的 NaN
    total_return = strategy_equity.iloc[-1] - 1.0
    return total_return

def optimize_parameters(csv_path, fast_list, slow_list):
    """
    网格搜索最佳参数组合
    """
    ticker = os.path.basename(csv_path).replace('.csv', '')
    best_return = -999.0
    best_params = (0, 0)
    
    # 遍历所有参数组合
    for fast, slow in itertools.product(fast_list, slow_list):
        if fast >= slow:
            continue # 短期均线周期必须小于长期
            
        ret = run_long_short_strategy(csv_path, fast, slow)
        
        if ret > best_return:
            best_return = ret
            best_params = (fast, slow)
            
    return {
        'Ticker': ticker,
        'Best_Fast_SMA': best_params[0],
        'Best_Slow_SMA': best_params[1],
        'Max_Long_Short_Return(%)': best_return * 100
    }

if __name__ == "__main__":
    data_directory = "lq45_data"
    
    # --- 步骤 1: 基本面过滤 ---
    valid_csv_files = fundamental_screener(data_directory, max_pe=15.0)
    
    if not valid_csv_files:
        print("没有股票通过 PE < 15 的筛选。")
        exit()
        
    print("\n" + "="*50)
    print("=== 开始针对低估值股票进行网格参数搜索 (多空策略) ===")
    
    # 定义网格搜索的参数空间
    fast_sma_candidates = [5, 10, 15, 20]
    slow_sma_candidates = [30, 40, 50, 60]
    
    print(f"搜索空间 -> Fast SMA: {fast_sma_candidates}")
    print(f"搜索空间 -> Slow SMA: {slow_sma_candidates}")
    print("-" * 50)
    
    # --- 步骤 2: 批量参数优化 ---
    optimization_results = []
    for file in valid_csv_files:
        res = optimize_parameters(file, fast_sma_candidates, slow_sma_candidates)
        optimization_results.append(res)
        print(f"完成优化: {res['Ticker']} -> 最优参数: {res['Best_Fast_SMA']}/{res['Best_Slow_SMA']}, 收益: {res['Max_Long_Short_Return(%)']:.2f}%")
        
    # --- 步骤 3: 打印最终结果 ---
    print("\n=== 最终优化报告 ===")
    df_results = pd.DataFrame(optimization_results)
    df_results.sort_values(by='Max_Long_Short_Return(%)', ascending=False, inplace=True)
    
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    print(df_results.to_string(index=False))
    
    output_name = "advanced_optimization_results.csv"
    df_results.to_csv(output_name, index=False)
    print(f"\n报告已保存至: {output_name}")
