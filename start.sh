#!/bin/sh
set -e

echo "▶ Ejecutando migraciones de base de datos..."
node_modules/.bin/drizzle-kit push

echo "▶ Iniciando servidor..."
exec node ./dist/server/entry.mjs
