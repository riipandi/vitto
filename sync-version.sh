#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(dirname "$0")

# Get current version from ROOT_DIR/package.json
CURRENT_VERSION=$(jq -r '.version' "$ROOT_DIR/package.json")
echo "Current version: $CURRENT_VERSION"

# Get new version from user
printf "%-20s: " "Enter new version (e.g. 1.2.3)"
read NEW_VERSION

# Validate version format (semver)
if [[ ! "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format X.Y.Z"
    exit 1
fi

# Update version in ROOT_DIR/package.json
jq --arg v "$NEW_VERSION" '.version = $v' "$ROOT_DIR/package.json" > "$ROOT_DIR/package.json.tmp"
mv "$ROOT_DIR/package.json.tmp" "$ROOT_DIR/package.json"

# Update version in all package.json in packages/**/** (exclude template-* folders)
find "$ROOT_DIR/packages" -type f -name package.json | grep -v '/template-' | while read -r pkg; do
    jq --arg v "$NEW_VERSION" '.version = $v' "$pkg" > "$pkg.tmp"
    mv "$pkg.tmp" "$pkg"
done

# Running code formatting after version update
if command -v pnpm >/dev/null 2>&1; then
    pnpm run --silent format
else
    echo "pnpm is not installed. Please run code formatting manually."
fi

echo "Version updated from $CURRENT_VERSION to $NEW_VERSION in all package.json files."
