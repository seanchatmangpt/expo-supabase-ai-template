#!/bin/bash
set -e

echo "======================================================"
echo "CAPTURE ALL ROUTES HARNESS"
echo "======================================================"

ROUTES=("" "openai" "process" "audit" "account")

for route in "${ROUTES[@]}"; do
  if [ -z "$route" ]; then
    URL="exp://localhost:8081/"
    FILE_NAME="route_index_proof.png"
    echo "[INFO] Navigating to Index Route..."
  else
    URL="exp://localhost:8081/--/$route"
    FILE_NAME="route_${route}_proof.png"
    echo "[INFO] Navigating to /$route Route..."
  fi

  xcrun simctl openurl booted "$URL"
  
  # Wait for route to render
  sleep 4
  
  # Take screenshot
  xcrun simctl io booted screenshot "/Users/sac/.gemini/antigravity-cli/brain/f8a81b87-4cd2-4b59-97ea-4df65a01aaf7/$FILE_NAME"
  echo "[SUCCESS] Captured $FILE_NAME"
done

echo "======================================================"
echo "ALL ROUTES CAPTURED."
echo "======================================================"
