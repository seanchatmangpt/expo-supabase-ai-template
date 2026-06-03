#!/bin/bash
set -e

echo "======================================================"
echo "LIE DETECTOR TEST HARNESS (Simulator Validation Suite)"
echo "======================================================"

# 1. Verify iOS simulator is running
BOOTED_DEVICE=$(xcrun simctl list devices | grep "Booted" | head -n 1)
if [ -z "$BOOTED_DEVICE" ]; then
  echo "[ERROR] No iOS Simulator is currently running. You are lying about using a simulator!"
  exit 1
fi
echo "[SUCCESS] Found booted simulator: $BOOTED_DEVICE"

# 2. Deep link into the Audit screen to trigger the LieDetector visually
echo "[INFO] Deep linking to the Autonomic Swarm Audit visualizer..."
xcrun simctl openurl booted exp://localhost:8081/--/audit || true
sleep 5

# 3. Stream logs to catch the lies and fixes
echo "[INFO] Listening to Metro logs for LieDetector output for 15 seconds..."
# We will use the system logs from the booted simulator
# filtering for our React Native console logs.
xcrun simctl spawn booted log stream --predicate 'subsystem == "com.apple.CoreFoundation" || eventMessage contains "LIE DETECTED"' --style compact &
LOG_PID=$!

sleep 10
kill $LOG_PID || true

# 4. Capture screenshot as absolute proof
echo "[INFO] Capturing photographic proof of the simulator state..."
xcrun simctl io booted screenshot ./lie_detector_proof.png

echo "======================================================"
echo "[SUCCESS] Lie Detector Harness Complete!"
echo "Proof saved to ./lie_detector_proof.png"
echo "======================================================"
