#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('repoguard')
  .description('A command-line tool for monitoring and protecting Git repositories')
  .version('0.1.0');

program
  .command('scan')
  .description('scan repository for security issues')
  .option('-p, --path <path>', 'repository path to scan', '.')
  .action((options) => {
    console.log(chalk.blue('🔍 Scanning repository...'));
    console.log(chalk.gray(`Path: ${options.path}`));
    console.log(chalk.yellow('⚠️  Feature coming soon'));
  });

program
  .command('init')
  .description('initialize repoguard configuration')
  .action(() => {
    console.log(chalk.green('🚀 Initializing RepoGuard configuration...'));
    console.log(chalk.yellow('⚠️  Feature coming soon'));
  });

program.parse();