import yfinance as yf
import pandas as pd
import os
from datetime import datetime

# LQ45 股票代码列表 (添加 .JK 后缀以适应 Yahoo Finance 的印尼股票代码格式)
# 这里列出部分核心权重股作为示例。完整的45只股票可以根据雅加达交易所最新名单补充。
lq45_tickers = [
    "BBCA.JK",  # Bank Central Asia (印尼最大市值银行)
    "BBRI.JK",  # Bank Rakyat Indonesia
    "BMRI.JK",  # Bank Mandiri
    "BBNI.JK",  # Bank Negara Indonesia
    "TLKM.JK",  # Telkom Indonesia (电信巨头)
    "ASII.JK",  # Astra International (汽车与多元化企业)
    "UNVR.JK",  # Unilever Indonesia (消费品)
    "ICBP.JK",  # Indofood CBP Sukses Makmur (食品)
    "INDF.JK",  # Indofood Sukses Makmur
    "ADRO.JK",  # Adaro Energy (煤炭能源)
    "GOTO.JK",  # GoTo Gojek Tokopedia (印尼最大科技独角兽)
    "AMMN.JK"   # Amman Mineral Internasional (矿业)
]

def download_and_clean_data(tickers, start_date, end_date, output_dir):
    """
    下载并清洗指定股票的历史数据
    """
    # 创建保存数据的目录
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"创建数据存储目录: {output_dir}")

    for ticker in tickers:
        print(f"正在下载 {ticker} 的数据...")
        try:
            # 使用 yfinance 下载数据
            # progress=False 隐藏单只股票的进度条以保持终端输出整洁
            df = yf.download(ticker, start=start_date, end=end_date, progress=False)
            
            if df.empty:
                print(f"警告: {ticker} 没有下载到数据。可能是代码错误或退市。\n")
                continue

            # --- 数据清洗步骤 ---
            
            # 1. 扁平化列名 (yfinance 最新版本可能会返回 MultiIndex 的列，我们需要将其展平)
            if isinstance(df.columns, pd.MultiIndex):
                # 提取第一层的列名 (如 'Open', 'High', 'Close')
                df.columns = [col[0] for col in df.columns]

            # 2. 重置索引，将 Date 从索引变成普通的一列
            df.reset_index(inplace=True)
            
            # 3. 检查并处理缺失值 (NaN)
            missing_values = df.isnull().sum().sum()
            if missing_values > 0:
                print(f"  发现 {missing_values} 个缺失值，正在进行填充...")
                # 使用前向填充 ffill (用前一天的收盘价等填补缺失的当前天数据，这在停牌时很常见)
                df.ffill(inplace=True)
                # 如果最开始有缺失值(比如上市初期没数据)，再用后向填充 bfill
                df.bfill(inplace=True)

            # 4. 处理异常交易日 (如停牌或成交量异常)
            # 在很多策略中，0 成交量的日子无法进行交易，我们在此做个统计并过滤
            initial_len = len(df)
            # 假设 Volume 列存在
            if 'Volume' in df.columns:
                df = df[df['Volume'] > 0]
                filtered_days = initial_len - len(df)
                if filtered_days > 0:
                    print(f"  剔除了 {filtered_days} 天成交量为 0 的数据 (可能是停牌日)。")

            # 5. 规范化列名格式 (全部小写，方便后续策略代码调用)
            df.columns = [col.lower() for col in df.columns]

            # 6. 保存到 CSV 文件
            # 移除 .JK 后缀作为文件名
            clean_name = ticker.replace('.JK', '')
            filename = os.path.join(output_dir, f"{clean_name}.csv")
            df.to_csv(filename, index=False)
            print(f"  成功保存清洗后的数据至: {filename}\n")

        except Exception as e:
            print(f"下载或清洗 {ticker} 时发生异常错误: {e}\n")

if __name__ == "__main__":
    # 设置下载的时间范围
    # 建议从一个整数年份开始，例如5年前
    START_DATE = "2019-01-01"
    
    # 获取今天的时间作为结束日期
    END_DATE = datetime.today().strftime('%Y-%m-%d')
    
    # 存放 CSV 数据文件的相对路径
    OUTPUT_FOLDER = "lq45_data"

    print(f"=== 开始下载印尼股票历史行情数据 ===")
    print(f"时间范围: {START_DATE} 到 {END_DATE}")
    print("-" * 50)
    
    download_and_clean_data(lq45_tickers, START_DATE, END_DATE, OUTPUT_FOLDER)
    
    print("-" * 50)
    print("所有数据下载与清洗任务执行完毕！")
