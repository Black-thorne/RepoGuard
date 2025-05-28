import * as fs from 'fs';
import * as path from 'path';

export class TestDataGenerator {
  static generateTestFiles(basePath: string, count: number = 20): void {
    const testDir = path.join(basePath, 'test-data');

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const sampleCode = [
      'const API_KEY = "sk-1234567890abcdef";',
      'const password = "secret123";',
      'const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";',
      'const mongoUrl = "mongodb://user:pass@localhost:27017/db";',
      'const normalCode = "console.log(\'Hello World\');";'
    ];

    for (let i = 1; i <= count; i++) {
      const fileName = `test-file-${i}.js`;
      const filePath = path.join(testDir, fileName);

      const content = [
        '// Test file generated for RepoGuard testing',
        `// File ${i} of ${count}`,
        '',
        ...sampleCode.slice(0, Math.floor(Math.random() * sampleCode.length) + 1),
        '',
        `module.exports = { testFile: ${i} };`
      ].join('\n');

      fs.writeFileSync(filePath, content);
    }

    console.log(`Generated ${count} test files in ${testDir}`);
  }
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }
}

export function calculateScanRate(filesCount: number, duration: number): string {
  const filesPerSecond = filesCount / (duration / 1000);
  return `${filesPerSecond.toFixed(1)} files/s`;
}