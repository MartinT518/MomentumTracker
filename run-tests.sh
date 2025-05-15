#!/bin/bash

# Run tests with explicit path to test files
cd "$(dirname "$0")"
npx vitest "client/src/**/*.test.{ts,tsx}" "$@"