#!/bin/bash
# Backup automatizado do SQLite de oxi-pedidos.
# Roda diário via cron na VPS.
#
# Setup do cron na VPS (uma vez):
#   crontab -e
#   0 3 * * * /root/oxi-pedidos/scripts/backup.sh >> /root/oxi-pedidos/logs/backup.log 2>&1

set -e

DB="/root/oxi-pedidos/server/data/oxi-pedidos.db"
BACKUP_DIR="/root/oxi-pedidos/backups"
DATE=$(date +%Y-%m-%d_%H%M)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# .backup é o método correto pra sqlite (lock-safe, hot backup)
sqlite3 "$DB" ".backup '$BACKUP_DIR/oxi-pedidos_$DATE.db'"

# Compacta
gzip "$BACKUP_DIR/oxi-pedidos_$DATE.db"

# Remove backups com mais de RETENTION_DAYS dias
find "$BACKUP_DIR" -name "oxi-pedidos_*.db.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup OK: oxi-pedidos_$DATE.db.gz"
