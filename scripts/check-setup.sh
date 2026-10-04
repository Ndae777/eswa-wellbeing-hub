#!/bin/bash
# Run from the project folder:   bash scripts/check-setup.sh
# Prints a plain report you can paste to Claude. It shows no passwords or keys.

ok()   { echo "  [OK]    $1"; }
bad()  { echo "  [FIX]   $1"; }
info() { echo "  [info]  $1"; }

echo "== 1. Are the new files in this folder?"
[ -f src/components/site/hero-banner.tsx ] && ok "hero-banner.tsx is here" || bad "hero-banner.tsx is MISSING: the step 3 zip was not unzipped into this folder"
[ -f scripts/make-hero-images.mjs ] && ok "make-hero-images.mjs is here" || bad "make-hero-images.mjs is MISSING"
grep -q "HeroBanner" src/routes/index.tsx 2>/dev/null && ok "the homepage uses the banner" || bad "src/routes/index.tsx is the OLD homepage: unzip the latest zip again"
grep -q '"hero-images"' package.json 2>/dev/null && ok "npm run hero-images exists" || bad "package.json is the old one"
[ -d node_modules/sharp ] && ok "sharp (photo tool) is installed" || bad "sharp is NOT installed: run  npm install"

echo
echo "== 2. Your original photos (hero-source folder)"
if [ -d hero-source ]; then
  n=$(ls hero-source 2>/dev/null | grep -ciE '\.(jpe?g|png|webp|avif)$')
  echo "  photos found: $n"
  ls -la hero-source | tail -n +4
  h=$(ls hero-source 2>/dev/null | grep -ciE '\.(heic|heif|gif|bmp|tiff?)$')
  [ "$h" -gt 0 ] && bad "$h file(s) are in a format the tool cannot use (heic/gif/bmp/tiff). Save them as JPEG or PNG"
else
  bad "the hero-source folder does not exist here. You are probably in the wrong folder"
fi

echo
echo "== 3. Prepared photos (this is what the website actually shows)"
if [ -d src/assets/hero ]; then
  m=$(ls src/assets/hero 2>/dev/null | grep -c '\.webp$')
  echo "  prepared files: $m  (2 per photo)"
  ls -la src/assets/hero | tail -n +4
  if [ "$m" -eq 0 ]; then
    bad "NOTHING prepared yet. This is why the site did not change. Run:  npm run hero-images"
  else
    ok "photos are prepared. Restart the dev server (Ctrl+C, then npm run dev) and refresh with Ctrl+Shift+R"
  fi
else
  bad "src/assets/hero does not exist"
fi

echo
echo "== 4. GitHub / Netlify"
if git rev-parse --git-dir >/dev/null 2>&1; then
  info "last commit: $(git log -1 --format='%h %s' 2>/dev/null)"
  info "branch: $(git branch --show-current)"
  c=$(git status --short | wc -l)
  echo "  uncommitted changes: $c"
  git status --short | head -15
  t=$(git ls-files src/assets/hero | grep -c '\.webp$')
  if [ "$t" -eq 0 ]; then
    bad "no prepared photos are saved in git. Netlify cannot show photos that were never pushed"
  else
    ok "$t prepared photo file(s) are saved in git"
  fi
else
  info "not a git folder"
fi
echo
echo "Copy everything above and paste it to Claude."
