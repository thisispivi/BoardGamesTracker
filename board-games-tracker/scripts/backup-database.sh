#!/bin/sh
# Writes a PostgreSQL dump whenever the newest one is BACKUP_INTERVAL_DAYS old
# and keeps the newest BACKUP_KEEP dumps. Connection settings come from the
# standard PGHOST, PGUSER, PGPASSWORD, and PGDATABASE variables.
#
# Usage: backup-database.sh          check every hour, forever
#        backup-database.sh --once   write one dump now and exit
set -eu
umask 077

backup_dir="${BACKUP_DIRECTORY:-/backups}"
interval_days="${BACKUP_INTERVAL_DAYS:-7}"
keep="${BACKUP_KEEP:-8}"
check_seconds=3600
prefix="board-games-tracker-"

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

for setting in "$interval_days" "$keep"; do
  case "$setting" in
    '' | *[!0-9]* | 0*)
      log "backup_invalid_setting BACKUP_INTERVAL_DAYS and BACKUP_KEEP must be positive whole numbers" >&2
      exit 64
      ;;
  esac
done

list_backups() {
  ls -1r "$backup_dir/$prefix"*.dump 2>/dev/null || true
}

backup_is_due() {
  newest=$(list_backups | head -n 1)
  if [ -z "$newest" ]; then
    return 0
  fi
  age=$(($(date +%s) - $(stat -c %Y "$newest")))
  [ "$age" -ge $((interval_days * 86400)) ]
}

create_backup() {
  name="$prefix$(date -u +%Y%m%dT%H%M%SZ).dump"
  partial="$backup_dir/.$name.partial"
  if pg_dump --format=custom --file="$partial"; then
    mv "$partial" "$backup_dir/$name"
    log "backup_created file=$name"
  else
    rm -f "$partial"
    log "backup_failed" >&2
    return 1
  fi
}

prune_backups() {
  list_backups | tail -n +$((keep + 1)) | while read -r old; do
    rm -f "$old"
    log "backup_pruned file=$(basename "$old")"
  done
}

mkdir -p "$backup_dir"
rm -f "$backup_dir/.$prefix"*.partial

if [ "${1:-}" = "--once" ]; then
  create_backup
  prune_backups
  exit 0
fi

log "backup_scheduler_started interval_days=$interval_days keep=$keep"
while :; do
  if backup_is_due && create_backup; then
    prune_backups
  fi
  sleep "$check_seconds"
done
