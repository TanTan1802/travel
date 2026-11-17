#!/usr/bin/env bash
# Chạy ngay sau "git add" trong workflow: báo lỗi nếu bản build còn trang / bundle chưa đưa vào commit.
# Thiếu thư mục trong danh sách git add → trang trên site trỏ tới bundle JS/CSS đã bị xoá (mất ảnh, mất tính năng).
set -euo pipefail
LEFT=$( { git diff --name-only; git ls-files --others --exclude-standard; } \
  | grep -E '\.(html|js|css|webp|xml|txt|json)$' \
  | grep -vE '^(test-results|playwright-report|\.lighthouseci|node_modules)/' \
  | sort -u || true )
if [ -n "$LEFT" ]; then
  echo "❌ Bản build còn file chưa đưa vào commit – thêm thư mục của chúng vào danh sách git add của workflow:"
  echo "$LEFT" | awk -F/ '{print ($1 ~ /^(en|ko|zh|ja)$/ ? $1"/"$2 : $1)}' | sort | uniq -c
  exit 1
fi
echo "✅ Mọi file build đã nằm trong commit"
