# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Status
- Package in development, not yet published to npm
- Documentation updated to reflect pre-release status
- Local installation via git clone is the current method

### Added
- Initial release preparation
- npm publishing setup (not yet executed)
- GitHub Actions workflows (ready for future use)
- Pre-release warnings in all documentation
- Clear installation instructions for local development

## [1.0.0] - Not Yet Released

### Added
- Initial release of iOS Simulator MCP Server
- Automatic screenshot capture on UI file changes
- Manual screenshot capture via MCP tools
- File watching with smart UI detection
- Screenshot history management
- MCP resources for screenshot access
- CLI helper commands
- Post-install setup instructions
- Comprehensive documentation

### Features
- 3 MCP Resources (latest-screenshot, screenshot-history, screenshot/{timestamp})
- 4 MCP Tools (capture, status, toggle, watcher-status)
- Automatic cleanup (keeps 50 most recent screenshots)
- Smart debouncing (2-second delay)
- React Native optimized file watching
- TypeScript implementation with full type safety

### Documentation
- Complete README with installation and usage
- Quick start guide
- Usage examples with 10+ scenarios
- Architecture documentation with visual diagrams
- Publishing guide for maintainers
- Troubleshooting section

[Unreleased]: https://github.com/emcap/ios-simulator-mcp/commits/main

