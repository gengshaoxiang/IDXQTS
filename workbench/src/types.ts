export type ModuleId =
  | 'workbench'
  | 'schedule'
  | 'todos'
  | 'notes'
  | 'rizhi'
  | 'media'
  | 'finance'
  | 'habits'
  | 'projects'
  | 'compass'
  | 'toolbox'
  | 'settings'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type AccentTheme = 'indigo' | 'violet' | 'forest' | 'rose' | 'ocean' | 'slate'
export type FontScale = 'compact' | 'standard' | 'relaxed'

export type DomainTag = '工作与治理' | '日知与学习' | '生活与家庭' | '自媒体创作'
export type PriorityLevel = '高' | '中' | '低'

export interface TodoItem {
  id: string
  title: string
  domain: DomainTag
  priority: PriorityLevel
  dueText: string
  repeat: '不重复' | '每天' | '每周' | '每月'
  tags: string[]
  completed: boolean
  quadrant: 'q1' | 'q2' | 'q3' | 'q4'
  createdAt: string
}

export interface ScheduleEvent {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  category: '战略' | '协同' | '学习' | '生活'
  durationMinutes: number
  note?: string
}

export interface SpecialDayMark {
  id: string
  date: string
  type: '休整日' | '跨国差旅' | '战略闭门'
  label: string
}

export interface CountdownItem {
  id: string
  title: string
  targetDate: string
  category: string
}

export interface NoteItem {
  id: string
  title: string
  folder: '管理与战略' | 'AI与数字员工' | '阅读摘录' | '生活与灵感'
  tags: string[]
  content: string
  updatedAt: string
}

export interface StickyNote {
  id: string
  content: string
  color: 'amber' | 'emerald' | 'sky' | 'violet'
  updatedAt: string
}

export interface RizhiColumn {
  id: string
  timeSlot: string
  title: string
  group: '政经与行业简报' | '系统长线课程'
  lessonCount: number
  totalTarget: number
  todayDone: boolean
  summary: string
  latestTopic: string
}

export interface BookItem {
  id: string
  title: string
  author: string
  status: '在读' | '想读' | '已读'
  currentPage: number
  totalPages: number
  spineColor: string
  takeaway: string
}

export interface IndoFlashcard {
  id: string
  indo: string
  phonetic: string
  zh: string
  scene: string
  mastered: boolean
}

export interface MediaDraft {
  id: string
  title: string
  platform: '微信公众号' | '小红书' | 'AI评论专栏' | '小说创作'
  stage: '选题池' | '撰写中' | '待排版' | '已发布'
  hook: string
  body: string
  desensitized: boolean
  updatedAt: string
}

export interface LedgerEntry {
  id: string
  title: string
  type: '收入' | '支出'
  amountCny: number
  category: string
  account: string
  date: string
}

export interface QuantWatchItem {
  id: string
  ticker: string
  market: 'IDX · LQ45' | 'Global'
  name: string
  fastSma: number
  slowSma: number
  costPrice: number
  currentPrice: number
  shares: number
  currency: 'IDR' | 'USD'
  signal: '多头金叉' | '震荡持有' | '空头观望'
}

export interface HabitItem {
  id: string
  title: string
  badgeChar: string
  frequency: string
  streak: number
  completedToday: boolean
  history: boolean[]
}

export interface StrategicProject {
  id: string
  title: string
  domain: DomainTag
  stage: '经营战略锚定' | '组织能力拆解' | '方案与治理设计' | '高密汇报打磨' | '落地跟踪闭环'
  progress: number
  summary: string
  deliverables: { id: string; label: string; done: boolean }[]
  milestones: string[]
}

export interface WheelDimension {
  id: string
  label: string
  score: number
  note: string
}

export interface WeeklyReviewData {
  weekLabel: string
  completedHighlights: string[]
  blockersAndPending: string[]
  nextWeekTopThree: [string, string, string]
  assistantDelegations: string[]
}

export type BentoCardId = 'weather' | 'calendar' | 'system' | 'todos' | 'stream'

export interface BentoCardConfig {
  id: BentoCardId
  title: string
  subtitle: string
  colSpan: 4 | 6 | 8 | 12
  visible: boolean
}

export interface WorkbenchSettings {
  brandName: string
  brandSubtitle: string
  greetingMotto: string
  themeMode: ThemeMode
  accentTheme: AccentTheme
  fontScale: FontScale
  activeCity: '雅加达' | '北京' | '达累斯萨拉姆' | '圣保罗' | '常州'
  activeTimezone: 'Asia/Jakarta' | 'Asia/Shanghai' | 'Africa/Dar_es_Salaam'
  fxRates: {
    cnyToIdr: number
    usdToIdr: number
    usdToCny: number
  }
  vaultPinHash: string | null
  vaultRecords: { id: string; label: string; account: string; maskedValue: string; note: string }[]
}

export interface HangyuState {
  settings: WorkbenchSettings
  bentoCards: BentoCardConfig[]
  todos: TodoItem[]
  schedules: ScheduleEvent[]
  specialDays: SpecialDayMark[]
  countdowns: CountdownItem[]
  notes: NoteItem[]
  stickies: StickyNote[]
  rizhiColumns: RizhiColumn[]
  books: BookItem[]
  indoCards: IndoFlashcard[]
  mediaDrafts: MediaDraft[]
  ledger: LedgerEntry[]
  quantWatch: QuantWatchItem[]
  habits: HabitItem[]
  projects: StrategicProject[]
  wheel: WheelDimension[]
  weeklyReview: WeeklyReviewData
  quickLinks: { id: string; char: string; label: string; targetModule: ModuleId }[]
}
