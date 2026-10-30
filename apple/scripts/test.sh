#!/usr/bin/env bash
# Runs the native unit tests on an iPhone and an iPad simulator.
# Hearth CI has no macOS runner yet, so run this before opening a PR that
# touches apple/ (native plan v2 §10).
set -euo pipefail
cd "$(dirname "$0")/.."

IPHONE="${IPHONE_SIM:-iPhone 17}"
IPAD="${IPAD_SIM:-iPad Pro 13-inch (M5)}"

for device in "$IPHONE" "$IPAD"; do
  echo "▸ Testing on $device"
  xcodebuild test \
    -project Hearth.xcodeproj \
    -scheme Hearth \
    -destination "platform=iOS Simulator,name=$device" \
    -quiet
done
