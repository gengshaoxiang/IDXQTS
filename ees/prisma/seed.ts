import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { makeBlindToken } from "../src/lib/crypto/blind-token";
import { computeRawWeightedScore } from "../src/lib/scoring/calculate";
import type { ScoreItem } from "../src/lib/scoring/star-validation";
import { DIMENSIONS } from "../src/lib/dimensions";

const prisma = new PrismaClient();

function allScores(base: number, jitter = 0): ScoreItem[] {
  const items: ScoreItem[] = [];
  for (const dim of DIMENSIONS) {
    for (const item of dim.items) {
      const score = Math.min(5, Math.max(1, base + jitter));
      const rounded = Math.round(score * 2) / 2;
      const entry: ScoreItem = {
        dimension_code: dim.code,
        item_code: item.code,
        score: rounded,
      };
      if (rounded >= 4.5 || rounded <= 2.5) {
        entry.star_evidence = {
          situation_task: "2026年Q3某大区供应链突发断供危机，终端库存告急",
          action: "第一时间亲赴一线协调备用冷链仓，连夜重构调拨方案",
          result: "48小时内恢复95%终端供货，未造成核心客户流失",
        };
      }
      items.push(entry);
    }
  }
  return items;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.evalResult.deleteMany();
  await prisma.complianceVeto.deleteMany();
  await prisma.evalBallot.deleteMany();
  await prisma.evalRelation.deleteMany();
  await prisma.evalSubject.deleteMany();
  await prisma.weightTemplate.deleteMany();
  await prisma.evalCycle.deleteMany();
  await prisma.appUser.deleteMany();

  const users = [
    { id: "U_ADMIN", name: "系统管理员", role: "ROLE_SUPER_ADMIN", title: "IT Admin", deptName: "数字化中心" },
    { id: "U_HRD", name: "陈组织", role: "ROLE_HRD_ADMIN", title: "集团HRD", deptName: "人力资源中心" },
    { id: "U_AUDIT", name: "周审计", role: "ROLE_AUDIT_OFFICER", title: "审计风控负责人", deptName: "审计法务中心" },
    { id: "U_CEO", name: "李总裁", role: "ROLE_CEO", title: "集团总裁", deptName: "总裁办" },
    { id: "U_GM_SEA", name: "张某", role: "ROLE_EXECUTIVE", title: "东南亚大区总经理", deptName: "东南亚大区" },
    { id: "U_GM_CN", name: "王某", role: "ROLE_EXECUTIVE", title: "中国区总经理", deptName: "中国区" },
    { id: "U_CFO", name: "赵财务", role: "ROLE_EXECUTIVE", title: "集团CFO", deptName: "财务中心" },
    { id: "U_PEER1", name: "刘平级", role: "ROLE_EXECUTIVE", title: "供应链中心负责人", deptName: "供应链中心" },
    { id: "U_SUB1", name: "下属甲", role: "ROLE_EVALUATOR", title: "销售总监", deptName: "东南亚大区" },
    { id: "U_SUB2", name: "下属乙", role: "ROLE_EVALUATOR", title: "运营总监", deptName: "东南亚大区" },
    { id: "U_SUB3", name: "下属丙", role: "ROLE_EVALUATOR", title: "市场总监", deptName: "东南亚大区" },
    { id: "U_FIN", name: "钱战略", role: "ROLE_EVALUATOR", title: "战略财务BP", deptName: "财务中心" },
  ];
  for (const u of users) {
    await prisma.appUser.create({ data: u });
  }

  const buTemplate = await prisma.weightTemplate.create({
    data: {
      templateCode: "BU_GM_TEMPLATE",
      templateName: "业务一号位（BU/区域GM）",
      dimensionWeights: JSON.stringify({
        STRATEGY_BIZ: 0.5,
        ORG_TALENT: 0.2,
        FORESIGHT_CHANGE: 0.15,
        LEADERSHIP_CULTURE: 0.15,
      }),
      roleWeights: JSON.stringify({
        STRATEGY_BIZ: { CEO: 0.7, FIN_STRAT: 0.3 },
        ORG_TALENT: { CEO: 0.4, HRD: 0.3, SUBORDINATE: 0.3 },
        FORESIGHT_CHANGE: { CEO: 0.5, PEER: 0.3, BOARD: 0.2 },
        LEADERSHIP_CULTURE: { PEER: 0.4, SUBORDINATE: 0.4, CEO: 0.2 },
      }),
    },
  });

  await prisma.weightTemplate.create({
    data: {
      templateCode: "FUNC_HEAD_TEMPLATE",
      templateName: "职能中心负责人",
      dimensionWeights: JSON.stringify({
        STRATEGY_BIZ: 0.3,
        ORG_TALENT: 0.25,
        FORESIGHT_CHANGE: 0.25,
        LEADERSHIP_CULTURE: 0.2,
      }),
      roleWeights: JSON.stringify({
        STRATEGY_BIZ: { CEO: 0.7, FIN_STRAT: 0.3 },
        ORG_TALENT: { CEO: 0.4, HRD: 0.3, SUBORDINATE: 0.3 },
        FORESIGHT_CHANGE: { CEO: 0.5, PEER: 0.3, BOARD: 0.2 },
        LEADERSHIP_CULTURE: { PEER: 0.4, SUBORDINATE: 0.4, CEO: 0.2 },
      }),
    },
  });

  const salt = randomBytes(32).toString("hex");
  const cycle = await prisma.evalCycle.create({
    data: {
      cycleName: "2026年度集团高管综合评价",
      cycleYear: 2026,
      status: "ACTIVE",
      secretSalt: salt,
      startTime: new Date("2026-11-01T00:00:00Z"),
      endTime: new Date("2026-12-20T18:00:00Z"),
    },
  });

  const subjectSea = await prisma.evalSubject.create({
    data: {
      cycleId: cycle.id,
      userId: "U_GM_SEA",
      userName: "张某",
      departmentName: "东南亚大区",
      positionTitle: "东南亚大区总经理",
      templateId: buTemplate.id,
      biKpiSnapshot: JSON.stringify({
        revenueAchievementRate: "106.4%",
        netProfitAchievementRate: "102.1%",
        strategicProjectsCompleted: "4/4",
      }),
      kpiObjectiveScore: 4.3,
    },
  });

  const subjectCn = await prisma.evalSubject.create({
    data: {
      cycleId: cycle.id,
      userId: "U_GM_CN",
      userName: "王某",
      departmentName: "中国区",
      positionTitle: "中国区总经理",
      templateId: buTemplate.id,
      biKpiSnapshot: JSON.stringify({
        revenueAchievementRate: "98.2%",
        netProfitAchievementRate: "95.0%",
        strategicProjectsCompleted: "3/4",
      }),
      kpiObjectiveScore: 3.9,
    },
  });

  // 张某评价关系：CEO + FIN + PEER + 仅 2 名下属（用于验收池化）
  const relationsSea = [
    { evaluatorUserId: "U_CEO", relationRole: "CEO" },
    { evaluatorUserId: "U_FIN", relationRole: "FIN_STRAT" },
    { evaluatorUserId: "U_HRD", relationRole: "HRD" },
    { evaluatorUserId: "U_PEER1", relationRole: "PEER" },
    { evaluatorUserId: "U_CEO", relationRole: "BOARD" },
    { evaluatorUserId: "U_SUB1", relationRole: "SUBORDINATE" },
    { evaluatorUserId: "U_SUB2", relationRole: "SUBORDINATE" },
  ];

  for (const r of relationsSea) {
    await prisma.evalRelation.create({
      data: {
        cycleId: cycle.id,
        subjectId: subjectSea.id,
        evaluatorUserId: r.evaluatorUserId,
        relationRole: r.relationRole,
        taskStatus: "PENDING",
      },
    });
  }

  // 王某：3 名下属，可独立展示
  const relationsCn = [
    { evaluatorUserId: "U_CEO", relationRole: "CEO" },
    { evaluatorUserId: "U_FIN", relationRole: "FIN_STRAT" },
    { evaluatorUserId: "U_HRD", relationRole: "HRD" },
    { evaluatorUserId: "U_PEER1", relationRole: "PEER" },
    { evaluatorUserId: "U_SUB1", relationRole: "SUBORDINATE" },
    { evaluatorUserId: "U_SUB2", relationRole: "SUBORDINATE" },
    { evaluatorUserId: "U_SUB3", relationRole: "SUBORDINATE" },
  ];
  for (const r of relationsCn) {
    await prisma.evalRelation.create({
      data: {
        cycleId: cycle.id,
        subjectId: subjectCn.id,
        evaluatorUserId: r.evaluatorUserId,
        relationRole: r.relationRole,
        taskStatus: "PENDING",
      },
    });
  }

  // 预填部分已提交选票（张某：2 下属已评，触发池化场景）
  async function submit(
    subjectId: string,
    evaluatorUserId: string,
    relationRole: string,
    base: number,
    jitter = 0,
  ) {
    const payload = allScores(base, jitter);
    const token = makeBlindToken(cycle.id, evaluatorUserId, salt);
    await prisma.evalBallot.create({
      data: {
        cycleId: cycle.id,
        subjectId,
        evaluatorBlindToken: token,
        relationRole,
        scoresPayload: JSON.stringify(payload),
        rawWeightedScore: computeRawWeightedScore(payload),
      },
    });
    await prisma.evalRelation.updateMany({
      where: { cycleId: cycle.id, subjectId, evaluatorUserId, relationRole },
      data: { taskStatus: "COMPLETED", submittedAt: new Date() },
    });
  }

  await submit(subjectSea.id, "U_CEO", "CEO", 4.5);
  await submit(subjectSea.id, "U_FIN", "FIN_STRAT", 4.0);
  await submit(subjectSea.id, "U_HRD", "HRD", 3.5);
  await submit(subjectSea.id, "U_PEER1", "PEER", 3.0);
  await submit(subjectSea.id, "U_CEO", "BOARD", 4.0);
  await submit(subjectSea.id, "U_SUB1", "SUBORDINATE", 4.5);
  await submit(subjectSea.id, "U_SUB2", "SUBORDINATE", 2.5);

  await submit(subjectCn.id, "U_CEO", "CEO", 3.5);
  await submit(subjectCn.id, "U_FIN", "FIN_STRAT", 3.5);
  await submit(subjectCn.id, "U_HRD", "HRD", 4.0);
  await submit(subjectCn.id, "U_PEER1", "PEER", 3.5);
  await submit(subjectCn.id, "U_SUB1", "SUBORDINATE", 3.5);
  await submit(subjectCn.id, "U_SUB2", "SUBORDINATE", 4.0);
  await submit(subjectCn.id, "U_SUB3", "SUBORDINATE", 3.0);

  console.log("Seed OK");
  console.log({ cycleId: cycle.id, subjectSea: subjectSea.id, subjectCn: subjectCn.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
