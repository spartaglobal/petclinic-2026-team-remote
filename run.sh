#!/bin/bash

# Enforce quality gates and ensure background Java processes are killed on exit
set -e 

cleanup() {
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Shutting down local API (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    taskkill //F //IM java.exe 2>/dev/null || true
}
trap cleanup EXIT

echo "========================================="
echo "🐾 Starting PetClinic Quality Pipeline 🐾"
echo "========================================="

# Ensure any old Java processes are cleared before starting
taskkill //F //IM java.exe 2>/dev/null || true

echo "1. Running Backend Unit Tests & Coverage Report..."
cd spring-petclinic-rest
./mvnw clean test jacoco:report

echo "2. Building and Resetting Backend API..."
./mvnw clean package -DskipTests

# Start the API in the background and grab its Process ID
java -jar target/*.jar &
BACKEND_PID=$!

echo "Waiting for API to boot up..."
sleep 20

echo "3. Running Newman API Tests (Skipped locally if 'jq' is missing, handled in cloud CI)..."
if command -v jq &> /dev/null; then
    bash postman-tests.sh
else
    echo "⚠️ 'jq' utility not found on Windows. Skipping local Newman execution (Cloud CI handles this)."
fi

echo "4. Setting up Frontend..."
cd ../spring-petclinic-angular
npm ci

echo "5. Running Frontend Lint & Unit Tests..."
npm run lint
npm run test:ci

echo "6. Running Playwright E2E & Accessibility Tests..."
npm run e2e

echo "========================================="
echo "✅ All Quality Gates Passed Successfully!"
echo "========================================="