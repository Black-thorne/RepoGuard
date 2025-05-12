# RepoGuard

A command-line tool for monitoring and protecting Git repositories from security vulnerabilities.

## Features

- 🔍 Scan repositories for sensitive information leaks
- 🚨 Detect API keys, passwords, and other secrets
- 📊 Generate security reports
- ⚙️ Configurable scanning rules

## Installation

```bash
npm install -g repoguard
```

## Usage

```bash
# Scan current directory
repoguard scan

# Scan specific path
repoguard scan -p /path/to/repo

# Initialize configuration
repoguard init
```

## Development

```bash
npm install
npm run build
npm run dev
```

## License

MIT