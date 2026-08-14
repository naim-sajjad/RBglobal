#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/html"
VENDOR_DIR="${APP_DIR}/vendor"
LOCK_FILE="${APP_DIR}/composer.lock"
HASH_FILE="${VENDOR_DIR}/.composer-lock-hash"

mkdir -p /tmp/opcache \
    "${APP_DIR}/storage/framework/cache/data" \
    "${APP_DIR}/storage/framework/sessions" \
    "${APP_DIR}/storage/framework/views" \
    "${APP_DIR}/bootstrap/cache"

chmod -R ugo+rw /tmp/opcache "${APP_DIR}/storage" "${APP_DIR}/bootstrap/cache" 2>/dev/null || true

current_hash=""
if [ -f "${LOCK_FILE}" ]; then
    current_hash="$(md5sum "${LOCK_FILE}" | awk '{print $1}')"
fi

stored_hash=""
if [ -f "${HASH_FILE}" ]; then
    stored_hash="$(cat "${HASH_FILE}")"
fi

if [ ! -f "${VENDOR_DIR}/autoload.php" ] || [ -z "${current_hash}" ] || [ "${current_hash}" != "${stored_hash}" ]; then
    echo "Populating Linux vendor volume (one-time / when composer.lock changes)..."
    composer install \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader \
        --working-dir="${APP_DIR}"
    mkdir -p "${VENDOR_DIR}"
    echo "${current_hash}" > "${HASH_FILE}"
    chmod -R ugo+rw "${VENDOR_DIR}" 2>/dev/null || true
fi

exec /usr/local/bin/start-container "$@"
