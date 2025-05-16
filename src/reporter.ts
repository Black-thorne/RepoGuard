import * as fs from 'fs';
import * as path from 'path';
import { ScanResult } from './scanner';

export interface ScanReport {
  timestamp: string;
  projectPath: string;
  totalFiles: number;
  totalIssues: number;
  issuesBySeverity: {
    high: number;
    medium: number;
    low: number;
  };
  results: ScanResult[];
}

export class Reporter {
  constructor(private projectPath: string) {}

  generateReport(results: ScanResult[]): ScanReport {
    const report: ScanReport = {
      timestamp: new Date().toISOString(),
      projectPath: this.projectPath,
      totalFiles: this.getUniqueFiles(results).length,
      totalIssues: results.length,
      issuesBySeverity: {
        high: results.filter(r => r.severity === 'high').length,
        medium: results.filter(r => r.severity === 'medium').length,
        low: results.filter(r => r.severity === 'low').length
      },
      results
    };

    return report;
  }

  async saveJsonReport(report: ScanReport, outputPath?: string): Promise<string> {
    const fileName = outputPath || `repoguard-report-${Date.now()}.json`;
    const content = JSON.stringify(report, null, 2);

    try {
      fs.writeFileSync(fileName, content, 'utf8');
      return fileName;
    } catch (error) {
      throw new Error(`Failed to save JSON report: ${error}`);
    }
  }

  async saveHtmlReport(report: ScanReport, outputPath?: string): Promise<string> {
    const fileName = outputPath || `repoguard-report-${Date.now()}.html`;
    const html = this.generateHtmlReport(report);

    try {
      fs.writeFileSync(fileName, html, 'utf8');
      return fileName;
    } catch (error) {
      throw new Error(`Failed to save HTML report: ${error}`);
    }
  }

  private generateHtmlReport(report: ScanReport): string {
    const severityColors = {
      high: '#dc3545',
      medium: '#ffc107',
      low: '#6c757d'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RepoGuard Security Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            padding: 20px;
            background: #ecf0f1;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        .results {
            padding: 20px;
        }
        .issue {
            border: 1px solid #ddd;
            margin: 10px 0;
            border-radius: 4px;
            overflow: hidden;
        }
        .issue-header {
            padding: 10px 15px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .issue-content {
            padding: 15px;
            background: #f9f9f9;
        }
        .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        .file-path {
            font-family: monospace;
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        .match-text {
            font-family: monospace;
            background: #fff3cd;
            padding: 8px;
            border-radius: 4px;
            margin-top: 10px;
            border-left: 4px solid #ffc107;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ RepoGuard Security Report</h1>
            <p>Generated: ${report.timestamp}</p>
            <p>Project: ${report.projectPath}</p>
        </div>

        <div class="stats">
            <div class="stat">
                <div class="stat-value">${report.totalFiles}</div>
                <div>Files Scanned</div>
            </div>
            <div class="stat">
                <div class="stat-value">${report.totalIssues}</div>
                <div>Total Issues</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: ${severityColors.high}">${report.issuesBySeverity.high}</div>
                <div>High Risk</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: ${severityColors.medium}">${report.issuesBySeverity.medium}</div>
                <div>Medium Risk</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: ${severityColors.low}">${report.issuesBySeverity.low}</div>
                <div>Low Risk</div>
            </div>
        </div>

        <div class="results">
            <h2>Security Issues</h2>
            ${report.results.map(result => `
                <div class="issue">
                    <div class="issue-header" style="background-color: ${severityColors[result.severity]}20;">
                        <span>${result.pattern}</span>
                        <span class="severity-badge" style="background-color: ${severityColors[result.severity]}">
                            ${result.severity}
                        </span>
                    </div>
                    <div class="issue-content">
                        <p><strong>File:</strong> <span class="file-path">${result.file}:${result.line}</span></p>
                        <div class="match-text">${this.escapeHtml(result.match)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    const div = { innerHTML: '' } as any;
    div.textContent = text;
    return div.innerHTML || text.replace(/[&<>"']/g, (match: string) => {
      const escape: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escape[match];
    });
  }

  private getUniqueFiles(results: ScanResult[]): string[] {
    return [...new Set(results.map(r => r.file))];
  }
}