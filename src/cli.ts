#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { SecurityScanner } from './scanner';
import { ConfigManager } from './config';
import { Reporter } from './reporter';

const program = new Command();

program
  .name('repoguard')
  .description('A command-line tool for monitoring and protecting Git repositories')
  .version('0.1.0');

program
  .command('scan')
  .description('scan repository for security issues')
  .option('-p, --path <path>', 'repository path to scan', '.')
  .option('-o, --output <file>', 'save report to file (json or html based on extension)')
  .option('--json <file>', 'save JSON report to file')
  .option('--html <file>', 'save HTML report to file')
  .action(async (options) => {
    console.log(chalk.blue('🔍 Scanning repository...'));
    console.log(chalk.gray(`Path: ${options.path}`));

    const scanner = new SecurityScanner(options.path);
    const results = await scanner.scanDirectory(options.path);
    const reporter = new Reporter(options.path);
    const report = reporter.generateReport(results);

    if (results.length === 0) {
      console.log(chalk.green('✅ No security issues found'));
    } else {
      console.log(chalk.red(`\n⚠️  Found ${results.length} potential security issues:\n`));

      results.forEach((result) => {
        const severityColor = result.severity === 'high' ? 'red' :
                             result.severity === 'medium' ? 'yellow' : 'gray';
        console.log(chalk[severityColor](`[${result.severity.toUpperCase()}] ${result.pattern}`));
        console.log(chalk.gray(`  File: ${result.file}:${result.line}`));
        console.log(chalk.gray(`  Match: ${result.match.substring(0, 50)}${result.match.length > 50 ? '...' : ''}\n`));
      });
    }

    // Generate reports if requested
    try {
      if (options.json) {
        const fileName = await reporter.saveJsonReport(report, options.json);
        console.log(chalk.green(`📄 JSON report saved to: ${fileName}`));
      }

      if (options.html) {
        const fileName = await reporter.saveHtmlReport(report, options.html);
        console.log(chalk.green(`📊 HTML report saved to: ${fileName}`));
      }

      if (options.output) {
        const ext = options.output.split('.').pop()?.toLowerCase();
        if (ext === 'json') {
          const fileName = await reporter.saveJsonReport(report, options.output);
          console.log(chalk.green(`📄 JSON report saved to: ${fileName}`));
        } else if (ext === 'html') {
          const fileName = await reporter.saveHtmlReport(report, options.output);
          console.log(chalk.green(`📊 HTML report saved to: ${fileName}`));
        } else {
          console.log(chalk.yellow('⚠️  Output file extension must be .json or .html'));
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to save report:'), error);
    }
  });

program
  .command('init')
  .description('initialize repoguard configuration')
  .action(() => {
    console.log(chalk.blue('🚀 Initializing RepoGuard configuration...'));

    const configManager = new ConfigManager();

    if (configManager.configExists()) {
      console.log(chalk.yellow('⚠️  Configuration file already exists'));
      console.log(chalk.gray('   Use --force to overwrite existing configuration'));
      return;
    }

    try {
      configManager.createDefaultConfig();
      console.log(chalk.green('✅ Created .repoguard.json configuration file'));
      console.log(chalk.gray('   You can now customize the security patterns and settings'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to create configuration file'));
      console.error(error);
    }
  });

program.parse();