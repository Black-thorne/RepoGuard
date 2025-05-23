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
  .option('-v, --verbose', 'enable verbose output')
  .option('-q, --quiet', 'suppress all output except errors')
  .action(async (options) => {
    if (!options.quiet) {
      console.log(chalk.blue('🔍 Scanning repository...'));
      console.log(chalk.gray(`Path: ${options.path}`));

      if (options.verbose) {
        console.log(chalk.gray('📊 Verbose mode enabled'));
      }
    }

    const scanStartTime = new Date();
    const scanner = new SecurityScanner(options.path);
    const results = await scanner.scanDirectory(options.path, options.verbose, options.quiet);
    const reporter = new Reporter(options.path);
    const report = reporter.generateReport(results, scanStartTime);

    if (!options.quiet) {
      if (results.length === 0) {
        console.log(chalk.green('✅ No security issues found'));

        if (options.verbose) {
          console.log(chalk.gray(`📁 Scanned ${report.totalFiles} files`));
          console.log(chalk.gray(`📊 Total patterns checked: ${scanner.getPatternCount()}`));
        }
      } else {
        console.log(chalk.red(`\n⚠️  Found ${results.length} potential security issues:\n`));

        results.forEach((result, index) => {
          const severityColor = result.severity === 'high' ? 'red' :
                               result.severity === 'medium' ? 'yellow' : 'gray';

          if (options.verbose) {
            console.log(chalk.gray(`--- Issue ${index + 1} ---`));
          }

          console.log(chalk[severityColor](`[${result.severity.toUpperCase()}] ${result.pattern}`));
          console.log(chalk.gray(`  File: ${result.file}:${result.line}`));

          if (options.verbose) {
            console.log(chalk.gray(`  Full match: ${result.match}`));
          } else {
            console.log(chalk.gray(`  Match: ${result.match.substring(0, 50)}${result.match.length > 50 ? '...' : ''}`));
          }

          console.log('');
        });

        if (options.verbose) {
          console.log(chalk.gray(`\n📊 Scan Statistics:`));
          console.log(chalk.gray(`  Files scanned: ${report.totalFiles}`));
          console.log(chalk.gray(`  High risk issues: ${report.issuesBySeverity.high}`));
          console.log(chalk.gray(`  Medium risk issues: ${report.issuesBySeverity.medium}`));
          console.log(chalk.gray(`  Low risk issues: ${report.issuesBySeverity.low}`));
        }
      }
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

program
  .command('whitelist')
  .description('manage whitelist for false positives')
  .option('-a, --add <file:pattern:match>', 'add item to whitelist (format: file:pattern:match)')
  .option('-l, --list', 'list all whitelist items')
  .option('-r, --remove <index>', 'remove whitelist item by index')
  .action((options) => {
    const configManager = new ConfigManager();

    if (!configManager.configExists()) {
      console.log(chalk.red('❌ Configuration file not found. Run "repoguard init" first.'));
      return;
    }

    const config = configManager.loadConfig();

    if (options.list) {
      console.log(chalk.blue('📋 Whitelist items:'));
      if (config.whitelist.length === 0) {
        console.log(chalk.gray('  No items in whitelist'));
      } else {
        config.whitelist.forEach((item, index) => {
          console.log(chalk.gray(`  ${index + 1}. ${item.file} | ${item.pattern} | ${item.match}`));
          if (item.reason) {
            console.log(chalk.gray(`     Reason: ${item.reason}`));
          }
        });
      }
    }

    if (options.add) {
      const parts = options.add.split(':');
      if (parts.length < 3) {
        console.log(chalk.red('❌ Invalid format. Use: file:pattern:match'));
        return;
      }

      const newItem = {
        file: parts[0],
        pattern: parts[1],
        match: parts.slice(2).join(':'),
        reason: 'Added via CLI'
      };

      config.whitelist.push(newItem);
      configManager.saveConfig(config);
      console.log(chalk.green('✅ Added item to whitelist'));
    }

    if (options.remove) {
      const index = parseInt(options.remove) - 1;
      if (index >= 0 && index < config.whitelist.length) {
        config.whitelist.splice(index, 1);
        configManager.saveConfig(config);
        console.log(chalk.green('✅ Removed item from whitelist'));
      } else {
        console.log(chalk.red('❌ Invalid index'));
      }
    }
  });

program.parse();