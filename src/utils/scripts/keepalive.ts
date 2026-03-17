/**
 * Keep-Alive Script
 * Mantiene el servicio activo en plataformas cloud haciendo ping periódico
 * 
 * Uso:
 * - Como módulo: import { startKeepAlive } from './keepalive'
 * - Como script: npm run keepalive
 */

import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const KEEPALIVE_URL = process.env.KEEPALIVE_URL || 'http://localhost:4000/health';
const INTERVAL_MIN = parseFloat(process.env.KEEPALIVE_INTERVAL_MIN || '10');
const INTERVAL_MS = Math.max(60000, Math.floor(INTERVAL_MIN * 60 * 1000));
const ENABLED = process.env.KEEPALIVE_ENABLED === 'true';

async function ping(): Promise<void> {
  if (!ENABLED) return;
  
  try {
    const res = await fetch(KEEPALIVE_URL, { method: 'GET' });
    console.log(
      `🔄 ${new Date().toISOString()} KEEPALIVE`,
      KEEPALIVE_URL,
      'status=',
      res.status
    );
  } catch (err: any) {
    console.error(
      `❌ ${new Date().toISOString()} KEEPALIVE ERROR`,
      err && err.message ? err.message : err
    );
  }
}

/**
 * Inicia el keep-alive integrado en el servidor (con delay de 30s)
 */
export function startKeepAlive(): void {
  if (!ENABLED) {
    console.log('⏸️  Keep-alive disabled');
    return;
  }
  
  console.log(`🔄 Keep-alive enabled: ${KEEPALIVE_URL} every ${INTERVAL_MIN} min`);
  
  // Ping inicial después de 30 segundos (dar tiempo al servidor)
  setTimeout(() => {
    ping();
    setInterval(ping, INTERVAL_MS);
  }, 30000);
}

/**
 * Ejecuta keep-alive standalone (inmediato, sin delay)
 */
function runStandalone(): void {
  if (!ENABLED) {
    console.log('⏸️  Keep-alive disabled. Set KEEPALIVE_ENABLED=true in .env');
    process.exit(0);
  }
  
  console.log('\n🔄 Keep-Alive Standalone Mode');
  console.log(`📍 Target: ${KEEPALIVE_URL}`);
  console.log(`⏱️  Interval: ${INTERVAL_MIN} minutes (${INTERVAL_MS}ms)`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
  
  // Ping inmediato y luego intervalo
  ping();
  setInterval(ping, INTERVAL_MS);
}

// Si se ejecuta como script principal (npm run keepalive)
if (require.main === module) {
  runStandalone();
}

export {};