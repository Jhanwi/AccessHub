#!/bin/bash

BASE_URL="http://localhost:5001"

echo "=============================="
echo "AccessHub API Tests"
echo "=============================="

echo ""
echo "1. Testing health endpoint..."

curl -s "$BASE_URL/api/health"

echo ""

echo ""
echo "2. Testing protected employees endpoint without token..."

curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  "$BASE_URL/api/employees"

echo ""
echo "3. Testing protected applications endpoint without token..."

curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  "$BASE_URL/api/applications"

echo ""
echo "Tests completed."

