#!/bin/bash

# Run tests
npx vitest "./client/src/**/*.test.{ts,tsx}" "$@"