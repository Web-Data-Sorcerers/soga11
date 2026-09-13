#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(dirname -- "$SCRIPT_DIR")
MANIFEST="$PROJECT_ROOT/release-manifest.txt"
DIST_DIR="$PROJECT_ROOT/dist"

if [ ! -f "$MANIFEST" ]; then
  echo "Release manifest is missing: $MANIFEST" >&2
  exit 1
fi

if [ "$DIST_DIR" != "$PROJECT_ROOT/dist" ] || [ "$PROJECT_ROOT" = "/" ]; then
  echo "Refusing to use an unsafe release output path." >&2
  exit 1
fi

DUPLICATE_ENTRY=$(LC_ALL=C sort "$MANIFEST" | uniq -d | head -n 1)
if [ -n "$DUPLICATE_ENTRY" ]; then
  echo "Duplicate release manifest entry: $DUPLICATE_ENTRY" >&2
  exit 1
fi

STAGE_DIR=$(mktemp -d "$PROJECT_ROOT/.dist-stage.XXXXXX")
cleanup() {
  rm -rf -- "$STAGE_DIR"
}
trap cleanup EXIT HUP INT TERM

FILE_COUNT=0
while IFS= read -r RELATIVE_PATH || [ -n "$RELATIVE_PATH" ]; do
  [ -n "$RELATIVE_PATH" ] || continue

  case "$RELATIVE_PATH" in
    /*|../*|*/../*|*/..)
      echo "Unsafe release manifest path: $RELATIVE_PATH" >&2
      exit 1
      ;;
  esac

  SOURCE_PATH="$PROJECT_ROOT/$RELATIVE_PATH"
  TARGET_PATH="$STAGE_DIR/$RELATIVE_PATH"

  if [ -L "$SOURCE_PATH" ] || [ ! -f "$SOURCE_PATH" ]; then
    echo "Release source must be a regular non-symlink file: $RELATIVE_PATH" >&2
    exit 1
  fi

  mkdir -p -- "$(dirname -- "$TARGET_PATH")"
  cp -- "$SOURCE_PATH" "$TARGET_PATH"
  FILE_COUNT=$((FILE_COUNT + 1))
done < "$MANIFEST"

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "Release manifest is empty." >&2
  exit 1
fi

rm -rf -- "$DIST_DIR"
mv -- "$STAGE_DIR" "$DIST_DIR"
trap - EXIT HUP INT TERM

echo "Built $FILE_COUNT runtime files in $DIST_DIR"
