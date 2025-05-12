#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { SecurityScanner } from './scanner';

const program = new Command();

program
  .name('repoguard')
  .description('A command-line tool for monitoring and protecting Git repositories')
  .version('0.1.0');

program
  .command('scan')
  .description('scan repository for security issues')
  .option('-p, --path <path>', 'repository path to scan', '.')
  .action(async (options) => {
    console.log(chalk.blue('🔍 Scanning repository...'));
    console.log(chalk.gray(`Path: ${options.path}`));

    const scanner = new SecurityScanner();
    const results = await scanner.scanDirectory(options.path);

    if (results.length === 0) {
      console.log(chalk.green('✅ No security issues found'));
      return;
    }

    console.log(chalk.red(`\n⚠️  Found ${results.length} potential security issues:\n`));

    results.forEach((result) => {
      const severityColor = result.severity === 'high' ? 'red' :
                           result.severity === 'medium' ? 'yellow' : 'gray';
      console.log(chalk[severityColor](`[${result.severity.toUpperCase()}] ${result.pattern}`));
      console.log(chalk.gray(`  File: ${result.file}:${result.line}`));
      console.log(chalk.gray(`  Match: ${result.match.substring(0, 50)}${result.match.length > 50 ? '...' : ''}\n`));
    });
  });

program
  .command('init')
  .description('initialize repoguard configuration')
  .action(() => {
    console.log(chalk.green('🚀 Initializing RepoGuard configuration...'));
    console.log(chalk.yellow('⚠️  Feature coming soon'));
  });

program.parse();