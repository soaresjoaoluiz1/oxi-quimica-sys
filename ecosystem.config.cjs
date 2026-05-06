/**
 * PM2 ecosystem — produção VPS Oxiquímica
 * Uso na VPS:
 *   cd /root/oxi-pedidos
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup    # uma vez, pra autostart no boot
 */
module.exports = {
  apps: [{
    name: 'dros-oxi-pedidos',
    cwd: '/root/oxi-pedidos',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production'
      /* PORT vem do .env (vamos com 3006 em produção pq 3005 já era do gestao-clin) */
    },
    error_file: '/root/oxi-pedidos/logs/err.log',
    out_file: '/root/oxi-pedidos/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
