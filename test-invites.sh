#!/bin/bash

BASE_URL="http://localhost:3000"
echo "🧪 Testing Project Invitation Flow at $BASE_URL"
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    if [ "$1" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Send Invite (Mocking auth/project existence might be tricky without full setup, but we'll try)
# We need a valid project ID. Assuming 1 exists or will fail.
# We also need a valid user token for the sender.
# For this test, we might need to rely on the fact that we can't easily mock auth in a bash script without login.
# So we'll just check if the endpoints are reachable.

echo "Checking if endpoints are reachable..."

# Check Validate Endpoint (should return 404 for random token)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/invites/validate/random-token")
if [ "$HTTP_CODE" -eq 404 ]; then
    print_status "SUCCESS" "Validate endpoint reachable (404 for invalid token)"
else
    print_status "ERROR" "Validate endpoint returned $HTTP_CODE"
fi

# Check Accept Endpoint (should return 400/404 for invalid token)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/invites/accept" -H "Content-Type: application/json" -d '{"token": "random"}')
if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 404 ]; then
    print_status "SUCCESS" "Accept endpoint reachable ($HTTP_CODE for invalid token)"
else
    print_status "ERROR" "Accept endpoint returned $HTTP_CODE"
fi

echo "To fully test, please use Postman or the frontend with a logged-in user."
