# EES · 集团高管在线评价系统

依据《集团高管在线评价系统（EES）技术实施文档 v1.0》落地的可运行基线：四维能力与业绩评估 + 一票否决风控底线，内置 STAR 强制举证、Z-Score 宽严度校准、下属人数阈值池化与盲化选票存储。

## 技术栈

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + ECharts
- Prisma ORM + SQLite（本地演示；生产可切换 PostgreSQL 15+）
- Zod 校验；HMAC-SHA256 评价人盲化令牌

> 演示环境以 Cookie 切换身份模拟企业微信 SSO；生产接入 OAuth2/OIDC 即可。

## 快速启动

```bash
cd ees
npm install
npx prisma db push
npm run db:seed
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，右上角选择演示身份：

| 身份 | 用途 |
| --- | --- |
| 陈组织 / HRD | 周期管理触发出分、校准看板 |
| 周审计 | 录入风控熔断 |
| 李总裁 | 校准看板与报告 |
| 下属甲/乙 | 提交 360 评价（种子数据中张某仅 2 名下属，用于池化验收） |

## 核心验收（UAT）

```bash
npm test
```

覆盖文档 8.2：

1. STAR 拦截（≥4.5 / ≤2.5 且举证不足 → 422）
2. 下属 &lt;3 人池化隐藏
3. Z-Score 与离线公式误差 &lt; 0.001
4. CRITICAL_VETO 将高分封顶为 C

## 主要 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/evaluations/tasks` | 当前用户待办 |
| POST | `/api/v1/evaluations/ballots` | 提交选票（STAR 校验 + 盲化） |
| POST | `/api/v1/compliance/vetoes` | 风控熔断（双人复核） |
| POST | `/api/v1/admin/cycles/{id}/calculate` | 全量校准出分 |
| GET | `/api/v1/reports/{subjectId}` | 个人 360 报告（含池化脱敏） |
| GET | `/api/v1/calibration` | 校准委员会看板 |

## 目录要点

```text
ees/
├── prisma/schema.prisma      # 文档第 5 章表结构（SQLite 适配）
├── prisma/seed.ts            # 演示周期与验收场景数据
├── src/lib/scoring/          # STAR / Z-Score / 池化 / 熔断 / 出分引擎
├── src/lib/crypto/           # HMAC 盲化令牌
└── src/app/                  # 页面与 API Routes
```
