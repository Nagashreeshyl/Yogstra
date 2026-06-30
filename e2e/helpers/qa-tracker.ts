import fs from 'node:fs'
import path from 'node:path'

export type IssuePriority = 'Critical' | 'High' | 'Medium' | 'Low'

export type QAIssue = {
  id: string
  title: string
  description: string
  priority: IssuePriority
  category:
    | 'bug'
    | 'performance'
    | 'security'
    | 'accessibility'
    | 'responsive'
    | 'ui'
    | 'workflow'
  route?: string
  screenshot?: string
  trace?: string
  video?: string
  consoleErrors?: string[]
  networkFailures?: string[]
  suggestedFix?: string
  timestamp: string
}

const artifactsDir = path.join(process.cwd(), 'qa-artifacts')
const issuesFile = path.join(artifactsDir, 'issues.json')

let issues: QAIssue[] = []

function ensureDir() {
  fs.mkdirSync(artifactsDir, { recursive: true })
}

export function loadIssues(): QAIssue[] {
  ensureDir()
  if (fs.existsSync(issuesFile)) {
    try {
      issues = JSON.parse(fs.readFileSync(issuesFile, 'utf8')) as QAIssue[]
    } catch {
      issues = []
    }
  }
  return issues
}

export function saveIssues() {
  ensureDir()
  fs.writeFileSync(issuesFile, JSON.stringify(issues, null, 2))
}

export function reportIssue(partial: Omit<QAIssue, 'id' | 'timestamp'>) {
  loadIssues()
  const issue: QAIssue = {
    ...partial,
    id: `QA-${String(issues.length + 1).padStart(4, '0')}`,
    timestamp: new Date().toISOString(),
  }
  issues.push(issue)
  saveIssues()
  return issue
}

export function getIssuesByCategory(category: QAIssue['category']) {
  return loadIssues().filter((i) => i.category === category)
}

export function getIssuesByPriority(priority: IssuePriority) {
  return loadIssues().filter((i) => i.priority === priority)
}

export function clearIssues() {
  issues = []
  saveIssues()
}

export function issuesSummary() {
  const all = loadIssues()
  return {
    total: all.length,
    critical: all.filter((i) => i.priority === 'Critical').length,
    high: all.filter((i) => i.priority === 'High').length,
    medium: all.filter((i) => i.priority === 'Medium').length,
    low: all.filter((i) => i.priority === 'Low').length,
    byCategory: {
      bug: all.filter((i) => i.category === 'bug').length,
      performance: all.filter((i) => i.category === 'performance').length,
      security: all.filter((i) => i.category === 'security').length,
      accessibility: all.filter((i) => i.category === 'accessibility').length,
      responsive: all.filter((i) => i.category === 'responsive').length,
      ui: all.filter((i) => i.category === 'ui').length,
      workflow: all.filter((i) => i.category === 'workflow').length,
    },
  }
}
