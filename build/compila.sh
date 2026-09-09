#!/bin/sh
# Ricompila il codice per i Safari datati (iPad su iOS 12).
# Da rilanciare ogni volta che si modifica qualcosa dentro public/js.
cd "$(dirname "$0")/.." || exit 1
npx esbuild public/js/app.js --bundle --target=es2017 --format=iife \
  --outfile=public/js/bundle.js --log-level=warning
echo "public/js/bundle.js rigenerato"
