#!/bin/bash
# Publish the PUBLIC files for Brú Guesthouse to gh-pages from an isolated
# worktree. _internal/, QA scripts, the local server and every SOURCE asset are
# deliberately NOT published: a client preview must never expose internal notes.
set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
WT="$(mktemp -d)/bru-pages"
ORIGIN="${PREVIEW_ORIGIN:-https://sindrimar02.github.io/bru-preview}"

# ALWAYS clean up, including on a failed gate: `set -e` exits before the
# removal at the bottom, and the leaked worktree then holds gh-pages so the
# NEXT run dies with "already used by worktree".
cleanup() { cd "$REPO" 2>/dev/null || true; git worktree remove --force "$WT" 2>/dev/null || true; git worktree prune 2>/dev/null || true; }
trap cleanup EXIT

# Build ON TOP of the published branch, never as a fresh orphan: an orphan
# re-root gives the remote unrelated history and forces a force-push, which the
# backup guard blocks, correctly.
git -C "$REPO" fetch -q origin gh-pages 2>/dev/null || true
git -C "$REPO" worktree prune 2>/dev/null || true
git -C "$REPO" worktree add --detach -q "$WT"
cd "$WT"
if git -C "$REPO" rev-parse --verify -q origin/gh-pages >/dev/null; then
  git checkout -q -B gh-pages origin/gh-pages
else
  git checkout -q --orphan gh-pages
  git rm -rq --cached . >/dev/null 2>&1 || true
fi
# Clear the staged tree INSIDE THE TEMP WORKTREE ONLY. Everything here is
# untracked after the orphan checkout, so this removes it precisely and can
# never wander outside the worktree. The earlier -type d sweep silently left
# root-level files behind, and gate 1 caught them.
git clean -xfdq

mkdir -p assets/img assets/fonts assets/vendor
cp "$REPO/index.html" "$REPO/styles.css" "$REPO/app.js" "$REPO/robots.txt" .
cp "$REPO"/assets/fonts/*.woff2 assets/fonts/
cp "$REPO"/assets/vendor/*.js   assets/vendor/

# SHIPPING ASSETS ONLY, DERIVED from what the page actually references. A
# hand-maintained list goes stale silently and ships a dead section.
grep -ohE '(src|href)="assets/img/[^"]+"' index.html \
  | sed -E 's/.*assets\/img\///; s/"$//' | sort -u > /tmp/bru-assets.txt
while read -r f; do [ -n "$f" ] && cp "$REPO/assets/img/$f" "assets/img/$f"; done < /tmp/bru-assets.txt
cp "$REPO/assets/img/favicon.svg" assets/img/
# the frame sequence is referenced from JS, so grep can never see it
cp -R "$REPO/assets/img/frames" "$REPO/assets/img/frames-sm" assets/img/
touch .nojekyll

# GATE 1 — nothing internal or source may reach the staged tree
leak=$(find . -path ./.git -prune -o \( -name '_*' -o -name 'src-*' \) -print)
if [ -n "$leak" ]; then
  echo "BLOCKED: internal or source files reached the staged tree:"; echo "$leak"; exit 1; fi
# GATE 2 — the preview must stay out of search
grep -q 'noindex' index.html || { echo "BLOCKED: index.html missing noindex"; exit 1; }
grep -q 'Disallow: /' robots.txt || { echo "BLOCKED: robots.txt does not disallow"; exit 1; }
# GATE 3 — every referenced asset must exist in the STAGED tree
missing=0
while read -r f; do [ -n "$f" ] && [ ! -f "assets/img/$f" ] && { echo "BLOCKED: missing asset $f"; missing=1; }; done < /tmp/bru-assets.txt
for f in frames/f001.jpg frames/f121.jpg frames-sm/f001.jpg frames-sm/f121.jpg; do
  [ -f "assets/img/$f" ] || { echo "BLOCKED: film frame $f did not stage"; missing=1; }; done
[ "$missing" = 0 ] || exit 1
# GATE 4 — the page must still carry every section. This is the gate that
# catches an over-eager edit deleting a block without any console error.
for id in hero plain film cottages inside details night book says where; do
  grep -q "id=\"$id\"" index.html || { echo "BLOCKED: section #$id is missing"; exit 1; }; done
# GATE 5 — a raster favicon twin, or Safari shows the ORIGIN root's icon
node "$REPO"/../_tools/favicon-guard.mjs "$WT"

echo "staged: $(find . -path ./.git -prune -o -type f -print | wc -l | tr -d ' ') files"
git add -A
git -c user.email=sindri@klubbr.is -c user.name="Sindri Már" \
    commit -q -m "Deploy $(git -C "$REPO" rev-parse --short HEAD) (noindex preview)" || echo "(nothing changed)"
git push -q origin gh-pages
cd "$REPO"
echo "published to $ORIGIN"
# on-disk correct is not proof the client sees an icon: check the DEPLOYED url
node "$REPO"/../_tools/favicon-verify-live.mjs "$ORIGIN/"
