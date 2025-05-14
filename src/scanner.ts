import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager, RepoGuardConfig } from './config';

export interface ScanResult {
  file: string;
  line: number;
  pattern: string;
  match: string;
  severity: 'high' | 'medium' | 'low';
}

export class SecurityScanner {
  private config: RepoGuardConfig;
  private patterns: Array<{
    name: string;
    regex: RegExp;
    severity: 'high' | 'medium' | 'low';
  }> = [];

  constructor(projectPath: string = '.') {
    const configManager = new ConfigManager(projectPath);
    this.config = configManager.loadConfig();
    this.loadPatterns();
  }

  private loadPatterns() {
    this.patterns = this.config.patterns
      .filter(p => p.enabled)
      .map(p => ({
        name: p.name,
        regex: new RegExp(p.regex, 'gi'),
        severity: p.severity
      }));
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

    const traverse = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath);

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.config.excludeDirs.includes(entry)) {
          traverse(fullPath);
        } else if (stat.isFile() && stat.size <= this.config.maxFileSize) {
          // Check if file should be included based on patterns
          const shouldInclude = this.config.includeFiles.some(pattern => {
            const regex = new RegExp(pattern.replace('*', '.*'), 'i');
            return regex.test(entry);
          });

          const shouldExclude = this.config.excludeFiles.some(pattern => {
            const regex = new RegExp(pattern.replace('*', '.*'), 'i');
            return regex.test(entry);
          });

          if (shouldInclude && !shouldExclude) {
            files.push(fullPath);
          }
        }
      }
    };

    traverse(dirPath);
    return files;
  }
}