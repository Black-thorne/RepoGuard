import * as fs from 'fs';
import * as path from 'path';

export interface RepoGuardConfig {
  patterns: Array<{
    name: string;
    regex: string;
    severity: 'high' | 'medium' | 'low';
    enabled: boolean;
  }>;
  excludeDirs: string[];
  includeFiles: string[];
  excludeFiles: string[];
  maxFileSize: number;
}

export class ConfigManager {
  private configPath: string;
  private defaultConfig: RepoGuardConfig = {
    patterns: [
      {
        name: 'API Key',
        regex: 'api[_-]?key[_-]?[\\w\\d]*[\\s]*[:=][\\s]*[\'"]?([a-zA-Z0-9_\\-]{20,})[\'"]?',
        severity: 'high',
        enabled: true
      },
      {
        name: 'Password',
        regex: 'password[\\s]*[:=][\\s]*[\'"]?([^\\s\'"){6,})[\'"]?',
        severity: 'high',
        enabled: true
      },
      {
        name: 'JWT Token',
        regex: 'eyJ[A-Za-z0-9_-]*\\.[A-Za-z0-9_-]*\\.[A-Za-z0-9_-]*',
        severity: 'medium',
        enabled: true
      },
      {
        name: 'Private Key',
        regex: '-----BEGIN [A-Z ]+ PRIVATE KEY-----',
        severity: 'high',
        enabled: true
      },
      {
        name: 'Database URL',
        regex: '(mongodb|mysql|postgres)://[^\\s]+',
        severity: 'medium',
        enabled: true
      }
    ],
    excludeDirs: ['node_modules', '.git', 'dist', 'coverage', '.next', 'build'],
    includeFiles: ['*.js', '*.ts', '*.json', '*.env', '*.config', '*.yaml', '*.yml'],
    excludeFiles: ['*.min.js', '*.bundle.js'],
    maxFileSize: 1024 * 1024 // 1MB
  };

  constructor(projectPath: string = '.') {
    this.configPath = path.join(projectPath, '.repoguard.json');
  }

  loadConfig(): RepoGuardConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf8');
        const userConfig = JSON.parse(configContent);
        return { ...this.defaultConfig, ...userConfig };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    return this.defaultConfig;
  }

  saveConfig(config: RepoGuardConfig): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  createDefaultConfig(): void {
    this.saveConfig(this.defaultConfig);
  }

  configExists(): boolean {
    return fs.existsSync(this.configPath);
  }
}