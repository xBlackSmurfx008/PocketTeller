#!/bin/bash
echo "=== Checking for iOS simulator logs ==="
xcrun simctl list devices | grep "Booted"
echo ""
echo "=== Recent app logs (last 50 lines) ==="
log show --predicate 'processImagePath contains "PocketTeller"' --last 1m --style compact | tail -50
