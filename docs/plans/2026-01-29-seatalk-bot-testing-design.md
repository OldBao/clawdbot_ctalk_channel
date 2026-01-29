# SeaTalk Echo Bot Testing Design

**Date:** 2026-01-29
**Status:** Approved

## Overview

Build a comprehensive testing suite for a SeaTalk echo bot that handles both text and image messages. The testing suite includes three layers: unit tests (existing), integration tests, and end-to-end tests.

## Bot Behavior

The echo bot responds to messages as follows:

- **Private chat text:** Responds with "Echo: [original text]"
- **Private chat image:** Sends back the same image
- **Group @mention text:** Responds with "Echo: [original text]"
- **Group @mention image:** Sends back the same image
- **Group messages without mention:** Ignored (no response)

## Architecture

### Three Testing Layers

**1. Unit Tests (Already Implemented)**
- Individual component tests for SDK, webhook server, message handler
- Currently well-covered in existing codebase

**2. Integration Tests (To Build)**
- Test the full flow with mocked HTTP calls
- Flow: Webhook receives message → handler processes → client sends response
- All HTTP calls mocked (no real server)
- Fast execution, isolated from network

**3. End-to-End Tests (To Build)**
- Real HTTP Express server running on random port
- Simulated webhook events sent via actual HTTP requests
- Mocked external SeaTalk API to verify responses
- Tests full request/response cycle including signature verification

## Components to Build

### 1. Main Bot Entry Point (`src/index.ts`)

**Purpose:** Wire together all components into a working bot

**Responsibilities:**
- Initialize webhook server, message handler, and SeaTalk client
- Register message callbacks implementing echo logic
- Handle both text and image message types
- Provide clean start/stop interface

**API:**
```typescript
class SeaTalkBot {
  constructor(config: SeaTalkConfig, botEmail: string)
  start(port: number): Promise<void>
  stop(): Promise<void>
  // Expose internals for testing
  get webhookServer()
  get client()
}
```

### 2. Integration Test (`src/bot.integration.test.ts`)

**Purpose:** Test full message flow without real HTTP server

**Test Cases:**
- Private chat text message → verify echo response sent
- Private chat image message → verify image echoed back
- Group mention with text → verify echo response
- Group mention with image → verify image echoed back
- Group message without mention → verify no response
- Error in handler → verify graceful error handling

**Mocking Strategy:**
- Mock all axios HTTP calls
- Mock webhook events injected directly
- No server startup required

### 3. E2E Test (`src/bot.e2e.test.ts`)

**Purpose:** Test with real HTTP server running

**Test Cases:**
- Valid webhook with text → server processes and sends response
- Valid webhook with image → server processes and sends image
- Invalid signature → 401 rejection
- Missing headers → 400 rejection
- Server lifecycle → starts and stops cleanly
- Concurrent requests → handled correctly

**Implementation:**
- Start Express server on random port
- Send real HTTP requests with proper signatures
- Mock only external SeaTalk API endpoints
- Verify responses via mocked API calls

### 4. Test Helpers (`src/test-helpers/`)

**fixtures.ts**
- Mock message events (text and image)
- Sample user data
- Common test configurations

**signature-utils.ts**
- Generate valid webhook signatures
- Create properly signed request headers
- Timestamp and nonce utilities

**mock-seatalk-api.ts**
- Utilities for mocking SeaTalk API responses
- Axios interceptor setup
- Response verification helpers

## Test Structure

```
src/
├── index.ts                          # Main bot entry point
├── bot.integration.test.ts           # Integration tests
├── bot.e2e.test.ts                   # E2E tests
├── test-helpers/
│   ├── fixtures.ts                   # Mock events and data
│   ├── signature-utils.ts            # Signature generation
│   └── mock-seatalk-api.ts          # API mock utilities
├── handlers/
│   └── message-handler.ts            # (existing)
├── sdk/
│   ├── client.ts                     # (existing)
│   └── types.ts                      # (existing)
└── webhook/
    └── server.ts                     # (existing)
```

## Technical Decisions

### Image Handling

SeaTalk image messages use `message.tag = 'image'` with image data in the `message.image` field. The bot will:
- Extract image data from incoming message
- Send back the same image structure via SeaTalk API
- Handle image URLs, keys, or media IDs

### Mock Strategy

**Integration Tests:**
- Mock axios completely
- No HTTP calls at all
- Direct function invocation

**E2E Tests:**
- Real Express server listening on random port
- Real HTTP requests to webhook endpoint
- Mock only external SeaTalk API via axios mocks/interceptors

### Error Handling

- Bot continues running if individual message handling fails
- Errors logged to console
- Failed messages don't crash the server
- Tests verify error scenarios are handled gracefully

### Test Execution

- Integration tests run fast (no server overhead)
- E2E tests use random ports to avoid conflicts
- Each test suite is independent and can run in parallel
- All tests clean up resources (close servers, clear mocks)

## Success Criteria

- All integration tests pass
- All E2E tests pass
- Both text and image echoing verified
- Error handling tested and working
- Tests run reliably in CI/CD
- Documentation clear for future developers
