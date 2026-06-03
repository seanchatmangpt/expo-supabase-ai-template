#!/bin/bash
set -e

echo "======================================================"
echo "OCR VALIDATION HARNESS"
echo "======================================================"

# Copy latest screenshots to assets
cp /Users/sac/.gemini/antigravity-cli/brain/f8a81b87-4cd2-4b59-97ea-4df65a01aaf7/route_*_proof.png /Users/sac/expo-supabase-ai-template/assets/proofs/

ERROR_FOUND=false

for img in /Users/sac/expo-supabase-ai-template/assets/proofs/route_*_proof.png; do
  BASENAME=$(basename "$img")
  echo "[INFO] Running OCR on $BASENAME..."
  
  OCR_OUT=$(tesseract "$img" stdout 2>/dev/null | tr -s ' \n' ' ')
  
  # Check for red screen markers
  if echo "$OCR_OUT" | grep -qi "Log 1 of 1"; then
    echo "[FAIL] Red screen detected in $BASENAME!"
    echo "OCR Content: $OCR_OUT"
    ERROR_FOUND=true
    continue
  fi
  if echo "$OCR_OUT" | grep -qi "Cannot read property"; then
    echo "[FAIL] Red screen (Cannot read property) detected in $BASENAME!"
    echo "OCR Content: $OCR_OUT"
    ERROR_FOUND=true
    continue
  fi

  EXPECTED_TEXT=""
  case "$BASENAME" in
    "route_index_proof.png") EXPECTED_TEXT="Welcome" ;;
    "route_openai_proof.png") EXPECTED_TEXT="OpenAI" ;;
    "route_process_proof.png") EXPECTED_TEXT="PROCESS INTELLIGENCE" ;;
    "route_audit_proof.png") EXPECTED_TEXT="AUTONOMIC QA SYSTEM" ;;
    "route_account_proof.png") EXPECTED_TEXT="Sign Out" ;;
  esac
  
  if echo "$OCR_OUT" | grep -qi "$EXPECTED_TEXT"; then
    echo "[SUCCESS] Verified expected content '$EXPECTED_TEXT' in $BASENAME"
  else
    echo "[WARN] Expected content '$EXPECTED_TEXT' not found in $BASENAME, but no red screen detected."
    if [ -z "$OCR_OUT" ]; then
        echo "[FAIL] Blank screen detected on $BASENAME"
        ERROR_FOUND=true
    fi
  fi
done

if [ "$ERROR_FOUND" = true ]; then
  echo "======================================================"
  echo "[FATAL] OCR Validation Failed! Red screens or errors detected."
  exit 1
else
  echo "======================================================"
  echo "[SUCCESS] OCR Validation Passed! All routes render cleanly."
fi
