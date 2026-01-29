# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository is for `clawdbot_ctalk_channel` - a project that is currently being initialized.

## Getting Started

*This section will be updated once the project structure is established.*

## Architecture

*This section will be updated once the codebase is developed.*

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run all tests
- `npm test -- --watch` - Run tests in watch mode
- `npm test -- --coverage` - Run tests with coverage report
- `npm run dev` - Run bot in development mode

## Testing

The project has comprehensive test coverage:

- **Unit tests**: Individual component tests (SDK, webhook, handlers)
- **Integration tests**: Full flow with mocked HTTP (`bot.integration.test.ts`)
- **E2E tests**: Real server with mocked external API (`bot.e2e.test.ts`)

Run specific test suites:
- `npm test -- bot.integration.test.ts`
- `npm test -- bot.e2e.test.ts`
