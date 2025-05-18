# RepoGuard

A command-line tool for monitoring and protecting Git repositories from security vulnerabilities.

## Features

- 🔍 **Repository Scanning**: Comprehensive scan for security issues in your codebase
- 🚨 **Secret Detection**: Detect API keys, passwords, JWT tokens, private keys, and database URLs
- 📊 **Rich Reporting**: Generate detailed reports in JSON and HTML formats
- ⚙️ **Configurable Rules**: Customize security patterns and scanning behavior
- 🎯 **Smart Filtering**: Include/exclude files and directories based on patterns
- 🌈 **Colorized Output**: Easy-to-read terminal output with severity indicators

## Installation

```bash
npm install -g repoguard
```

## Quick Start

```bash
# Initialize configuration file
repoguard init

# Scan current directory
repoguard scan

# Scan with reports
repoguard scan --html report.html --json report.json

# Scan specific path
repoguard scan -p /path/to/repo -o security-report.html
```

## Commands

### `scan` - Scan repository for security issues

```bash
repoguard scan [options]

Options:
  -p, --path <path>     Repository path to scan (default: ".")
  -o, --output <file>   Save report to file (json or html based on extension)
  --json <file>         Save JSON report to file
  --html <file>         Save HTML report to file
```

### `init` - Initialize configuration

```bash
repoguard init

Creates a .repoguard.json configuration file with default settings.
```

## Configuration

RepoGuard uses a `.repoguard.json` configuration file to customize scanning behavior:

```json
{
  "patterns": [
    {
      "name": "API Key",
      "regex": "api[_-]?key[_-]?[\\w\\d]*[\\s]*[:=][\\s]*['\"]?([a-zA-Z0-9_\\-]{20,})['\"]?",
      "severity": "high",
      "enabled": true
    }
  ],
  "excludeDirs": ["node_modules", ".git", "dist", "coverage"],
  "includeFiles": ["*.js", "*.ts", "*.json", "*.env"],
  "excludeFiles": ["*.min.js"],
  "maxFileSize": 1048576
}
```

## Security Patterns

RepoGuard detects these security issues by default:

- **API Keys**: Various API key patterns
- **Passwords**: Plain text passwords in configuration
- **JWT Tokens**: JSON Web Tokens
- **Private Keys**: RSA/SSH private keys
- **Database URLs**: MongoDB, MySQL, PostgreSQL connection strings

## Development

```bash
# Clone and install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Test the CLI
npm run build && node dist/cli.js scan
```

## Report Formats

### HTML Report
- Interactive dashboard with statistics
- Color-coded severity levels
- Detailed file locations and matches
- Professional styling

### JSON Report
- Machine-readable format
- Complete scan metadata
- Perfect for CI/CD integration
- Easy to parse and analyze

## License

MIT