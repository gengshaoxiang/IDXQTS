import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Compass,
  Feather,
  FileText,
  FolderKanban,
  LayoutGrid,
  Repeat,
  Settings2,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import type { ModuleId } from '../types'

export interface NavModuleMeta {
  id: ModuleId
  label: string
  subtitle: string
  icon: typeof LayoutGrid
}

export const NAV_MODULES: NavModuleMeta[] = [
  { id: 'workbench', label: '工作台', subtitle: '今日航迹与全局概览', icon: LayoutGrid },
  { id: 'schedule', label: '日程管理', subtitle: '校准关键节点，而非填满时间', icon: CalendarDays },
  { id: 'todos', label: '待办事项', subtitle: '四大领域、四象限与番茄专注', icon: CheckSquare },
  { id: 'notes', label: '笔记知识库', subtitle: '战略思考、管理手记与双向链接', icon: FileText },
  { id: 'rizhi', label: '日知与智库', subtitle: '早间14栏订阅、书脊书架与印尼语', icon: BookOpen },
  { id: 'media', label: '自媒体工坊', subtitle: '公众号、小红书、AI专栏与小说', icon: Feather },
  { id: 'finance', label: '汇率与量化', subtitle: 'IDR跨境牌价、财务潮汐与LQ45观察', icon: TrendingUp },
  { id: 'habits', label: '习惯追踪', subtitle: '把微小重复变成长期复利印章', icon: Repeat },
  { id: 'projects', label: '战略项目', subtitle: '从经营战略反推组织与落地闭环', icon: FolderKanban },
  { id: 'compass', label: '人生罗盘', subtitle: '每周三件重点复盘与人生之轮8维雷达', icon: Compass },
  { id: 'toolbox', label: '工具箱', subtitle: '会议倒计时、科学计算与萃豆实验台', icon: Wrench },
  { id: 'settings', label: '设置与数据', subtitle: '外观主题、保险库备忘与本地备份', icon: Settings2 },
]
