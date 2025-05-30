#!/bin/bash

# AetherRun Test Suite Runner
# This script runs all types of tests for the AetherRun application

set -e  # Exit on any error

echo "🏃‍♂️ AetherRun Test Suite"
echo "========================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if Python is available for link checker
if ! command -v python3 &> /dev/null; then
    print_warning "Python3 is not available. Link checker will be skipped."
    SKIP_LINK_CHECK=true
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run different types of tests based on arguments
run_unit_tests() {
    print_status "Running unit tests with Vitest..."
    npm run test
    print_success "Unit tests completed!"
}

run_integration_tests() {
    print_status "Running integration tests..."
    npm run test:integration
    print_success "Integration tests completed!"
}

run_e2e_tests() {
    print_status "Installing Playwright browsers (if needed)..."
    npx playwright install --with-deps
    
    print_status "Running end-to-end tests with Playwright..."
    npm run test:e2e
    print_success "E2E tests completed!"
}

run_link_check() {
    if [ "$SKIP_LINK_CHECK" = true ]; then
        print_warning "Skipping link check - Python3 not available"
        return
    fi
    
    print_status "Running link checker..."
    
    # Check if the app is running
    if ! curl -s http://localhost:5000 > /dev/null; then
        print_warning "Application not running on localhost:5000"
        print_status "Starting application for link checking..."
        npm run dev &
        APP_PID=$!
        
        # Wait for app to start
        sleep 10
        
        if ! curl -s http://localhost:5000 > /dev/null; then
            print_error "Could not start application for link checking"
            kill $APP_PID 2>/dev/null || true
            return 1
        fi
    fi
    
    # Install required Python packages
    if ! python3 -c "import requests" 2>/dev/null; then
        print_status "Installing required Python packages..."
        pip3 install requests beautifulsoup4 2>/dev/null || {
            print_warning "Could not install Python packages. Skipping link check."
            return
        }
    fi
    
    python3 scripts/link-checker.py http://localhost:5000 --max-pages 20 --output link-check-report.json
    
    # Kill the app if we started it
    if [ ! -z "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    
    print_success "Link check completed! Report saved to link-check-report.json"
}

# Parse command line arguments
case "${1:-all}" in
    "unit")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "links")
        run_link_check
        ;;
    "all")
        print_status "Running complete test suite..."
        echo ""
        
        # Run unit tests
        run_unit_tests
        echo ""
        
        # Run integration tests
        run_integration_tests
        echo ""
        
        # Run E2E tests
        run_e2e_tests
        echo ""
        
        # Run link check
        run_link_check
        echo ""
        
        print_success "All tests completed successfully! 🎉"
        ;;
    "help")
        echo "Usage: $0 [test-type]"
        echo ""
        echo "Test types:"
        echo "  unit        - Run unit tests only"
        echo "  integration - Run integration tests only"
        echo "  e2e         - Run end-to-end tests only"
        echo "  links       - Run link checker only"
        echo "  all         - Run all tests (default)"
        echo "  help        - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 unit"
        echo "  $0 e2e"
        echo "  $0 all"
        ;;
    *)
        print_error "Unknown test type: $1"
        echo "Use '$0 help' for usage information."
        exit 1
        ;;
esac