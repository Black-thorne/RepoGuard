import * as fs from 'fs';
import * as path from 'path';

export interface ScanResult {
  file: string;
  line: number;
  pattern: string;
  match: string;
  severity: 'high' | 'medium' | 'low';
}

export class SecurityScanner {
  private patterns: Array<{
    name: string;
    regex: RegExp;
    severity: 'high' | 'medium' | 'low';
  }> = [];

  constructor() {
    this.loadDefaultPatterns();
  }

  private loadDefaultPatterns() {
    // Basic patterns for common secrets
    this.patterns = [
      {
        name: 'API Key',
        regex: /api[_-]?key[_-]?[\w\d]*[\s]*[:=][\s]*['"']?([a-zA-Z0-9_\-]{20,})['"']?/gi,
        severity: 'high'
      },
      {
        name: 'Password',
        regex: /password[\s]*[:=][\s]*['"']?([^\s'"]{6,})['"']?/gi,
        severity: 'high'
      },
      {
        name: 'JWT Token',
        regex: /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
        severity: 'medium'
      }
    ];
  }

  async scanDirectory(dirPath: string): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    try {
      const files = await this.getFiles(dirPath);

      for (const file of files) {
        const fileResults = await this.scanFile(file);
        results.push(...fileResults);
      }
    } catch (error) {
      console.error(`Error scanning directory: ${error}`);
    }

    return results;
  }

  private async scanFile(filePath: string): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const pattern of this.patterns) {
          const matches = line.match(pattern.regex);
          if (matches) {
            results.push({
              file: filePath,
              line: index + 1,
              pattern: pattern.name,
              match: matches[0],
              severity: pattern.severity
            });
          }
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }

    return results;
  }

  private async getFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const excludeDirs = ['node_modules', '.git', 'dist', 'coverage'];

    const traverse = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath);

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !excludeDirs.includes(entry)) {
          traverse(fullPath);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    };

    traverse(dirPath);
    return files;
  }
}