#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

# Get current version from ROOT_DIR/package.json
CURRENT_VERSION=$(jq -r '.version' "$ROOT_DIR/package.json")
echo "Current version: $CURRENT_VERSION"

# Check if version is provided as argument
if [ $# -eq 1 ]; then
    NEW_VERSION="$1"
    echo "Using provided version: $NEW_VERSION"
else
    # Get new version from user
    printf "%-20s: " "Enter new version (e.g. 1.2.3)"
    read NEW_VERSION
fi

# Validate version format (semantic versioning: X.Y.Z or X.Y.Z-suffix)
if [[ ! "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9\.\-]+)?$ ]]; then
    echo "Error: Version must follow semantic versioning format (e.g., 0.0.0 or 1.2.3-beta.1)"
    exit 1
fi

# Check if version is different from current — skip prompt in CI
if [ "$NEW_VERSION" = "$CURRENT_VERSION" ]; then
    echo "Warning: New version is the same as current version"
    if [ -t 0 ]; then
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 0
        fi
    else
        echo "Non-interactive shell — proceeding with version sync."
    fi
fi

# Update version in ROOT_DIR/package.json
jq --arg v "$NEW_VERSION" '.version = $v' "$ROOT_DIR/package.json" >"$ROOT_DIR/package.json.tmp"
mv "$ROOT_DIR/package.json.tmp" "$ROOT_DIR/package.json"

# Update version in all package.json in packages/**/** (exclude template-* folders)
find "$ROOT_DIR/packages" -type f -name package.json | grep -v '/template-' | while read -r pkg; do
    jq --arg v "$NEW_VERSION" '.version = $v' "$pkg" >"$pkg.tmp"
    mv "$pkg.tmp" "$pkg"
    echo "Updated version in: $pkg"
done

# Update vitto devDependencies in all template-* folders
find "$ROOT_DIR/packages/create-vitto" -type f -name package.json | grep '/template-' | while read -r pkg; do
    if jq -e '.devDependencies.vitto' "$pkg" >/dev/null 2>&1; then
        jq --arg v "^$NEW_VERSION" '.devDependencies.vitto = $v' "$pkg" >"$pkg.tmp"
        mv "$pkg.tmp" "$pkg"
        echo "Updated vitto version in: $pkg"
    fi
done

# Update vitto devDependencies in starter/package.json
STARTER_PKG="$ROOT_DIR/starter/package.json"
if [ -f "$STARTER_PKG" ]; then
    if jq -e '.devDependencies.vitto' "$STARTER_PKG" >/dev/null 2>&1; then
        jq --arg v "^$NEW_VERSION" '.devDependencies.vitto = $v' "$STARTER_PKG" >"$STARTER_PKG.tmp"
        mv "$STARTER_PKG.tmp" "$STARTER_PKG"
        echo "Updated vitto version in: $STARTER_PKG"
    fi
fi

# Running code formatting after version update
if command -v pnpm >/dev/null 2>&1; then
    echo "Running code formatting..."
    pnpm run --silent format
else
    echo "pnpm is not installed. Please run code formatting manually."
fi

echo ""
echo "✓ Version updated from $CURRENT_VERSION to $NEW_VERSION"
echo "✓ All package.json files have been updated"
echo "✓ Template and starter vitto devDependencies have been updated"
