import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter'
import fs from 'node:fs'
import path from 'node:path'
import { issuesSummary, loadIssues, type QAIssue } from '../helpers/qa-tracker'

const docsDir = path.join(process.cwd(), 'docs', 'qa')
const artifactsDir = path.join(process.cwd(), 'qa-artifacts')

function ensureDocsDir() {
  fs.mkdirSync(docsDir, { recursive: true })
}

function formatIssueList(issues: QAIssue[]) {
  if (!issues.length) return '_No issues recorded._\n'
  return issues
    .map(
      (i) => `### ${i.id} — ${i.title} (${i.priority})

- **Category:** ${i.category}
- **Route:** ${i.route ?? '—'}
- **Description:** ${i.description}
${i.suggestedFix ? `- **Suggested fix:** ${i.suggestedFix}` : ''}
${i.screenshot ? `- **Screenshot:** \`qa-artifacts/${i.screenshot}\`` : ''}
`,
    )
    .join('\n')
}

function writeReport(filename: string, content: string) {
  fs.writeFileSync(path.join(docsDir, filename), content)
}

class QAMarkdownReporter implements Reporter {
  private results: { title: string; status: string; duration: number }[] = []

  onBegin(_config: FullConfig) {
    ensureDocsDir()
    fs.mkdirSync(artifactsDir, { recursive: true })
    if (fs.existsSync(path.join(artifactsDir, 'issues.json'))) {
      fs.unlinkSync(path.join(artifactsDir, 'issues.json'))
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.results.push({
      title: test.title,
      status: result.status,
      duration: result.duration,
    })
  }

  onEnd(result: FullResult) {
    const issues = loadIssues()
    const summary = issuesSummary()
    const passed = this.results.filter((r) => r.status === 'passed').length
    const failed = this.results.filter((r) => r.status === 'failed').length
    const skipped = this.results.filter((r) => r.status === 'skipped').length
    const date = new Date().toISOString().slice(0, 10)

    writeReport(
      'QA_REPORT.md',
      `# QA Report — Yogstra

**Date:** ${date}  
**Playwright status:** ${result.status}  
**Tests:** ${this.results.length} total · ${passed} passed · ${failed} failed · ${skipped} skipped  
**Issues found:** ${summary.total} (${summary.critical} critical, ${summary.high} high, ${summary.medium} medium, ${summary.low} low)

## Artifacts

| Artifact | Location |
|---|---|
| HTML report | \`qa-artifacts/html-report/index.html\` |
| JSON results | \`qa-artifacts/results.json\` |
| Screenshots | \`qa-artifacts/screenshots/\` |
| Videos | \`qa-artifacts/test-results/\` |
| Traces | \`qa-artifacts/test-results/\` (on failure) |

## Issue summary by category

| Category | Count |
|---|---|
| Bug | ${summary.byCategory.bug} |
| Performance | ${summary.byCategory.performance} |
| Security | ${summary.byCategory.security} |
| Accessibility | ${summary.byCategory.accessibility} |
| Responsive | ${summary.byCategory.responsive} |
| UI | ${summary.byCategory.ui} |
| Workflow | ${summary.byCategory.workflow} |

## Test results

${this.results.map((r) => `- [${r.status}] ${r.title} (${Math.round(r.duration)}ms)`).join('\n')}

## All issues

${formatIssueList(issues)}
`,
    )

    writeReport(
      'BUG_REPORT.md',
      `# Bug Report — Yogstra QA

**Date:** ${date}  
**Total bugs:** ${summary.byCategory.bug}

${formatIssueList(issues.filter((i) => i.category === 'bug'))}
`,
    )

    writeReport(
      'PERFORMANCE_REPORT.md',
      `# Performance Report — Yogstra QA

**Date:** ${date}

${formatIssueList(issues.filter((i) => i.category === 'performance'))}
`,
    )

    writeReport(
      'SECURITY_REPORT.md',
      `# Security Report — Yogstra QA

**Date:** ${date}

${formatIssueList(issues.filter((i) => i.category === 'security'))}
`,
    )

    writeReport(
      'RESPONSIVE_REPORT.md',
      `# Responsive Report — Yogstra QA

**Date:** ${date}

${formatIssueList(issues.filter((i) => i.category === 'responsive'))}
`,
    )

    writeReport(
      'ACCESSIBILITY_REPORT.md',
      `# Accessibility Report — Yogstra QA

**Date:** ${date}

${formatIssueList(issues.filter((i) => i.category === 'accessibility'))}
`,
    )

    writeReport(
      'UI_CONSISTENCY_REPORT.md',
      `# UI Consistency Report — Yogstra QA

**Date:** ${date}

${formatIssueList(issues.filter((i) => i.category === 'ui'))}
`,
    )

    writeReport(
      'WORKFLOW_REPORT.md',
      `# Workflow Report — Yogstra QA

**Date:** ${date}

${formatIssueList(issues.filter((i) => i.category === 'workflow'))}
`,
    )
  }
}

export default QAMarkdownReporter
