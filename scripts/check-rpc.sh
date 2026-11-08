#!/usr/bin/env bash
# Muestra todas las migrations que definen o redefinen un RPC, en orden cronológico.
# Usar SIEMPRE antes de escribir una migration con CREATE OR REPLACE FUNCTION.
# La migration más reciente de la lista es la base correcta.
#
# Uso: ./scripts/check-rpc.sh <nombre_funcion>
# Ej:  ./scripts/check-rpc.sh registrar_parto

set -euo pipefail

FUNCION="${1:-}"

if [[ -z "$FUNCION" ]]; then
  echo "Uso: $0 <nombre_funcion>"
  echo "Ej:  $0 registrar_parto"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/supabase/migrations"

echo ""
echo "Migrations que definen '$FUNCION' (orden cronológico):"
echo "────────────────────────────────────────────────────────"

# El nombre debe ir seguido de "(" (con espacios opcionales): sin esta frontera,
# buscar "registrar_destete" coincidía también con "registrar_destete_crias" y el
# script señalaba como base la migration de OTRA función.
RESULTADOS=$(grep -rnE "CREATE OR REPLACE FUNCTION ${FUNCION}[[:space:]]*\(" "$MIGRATIONS_DIR" 2>/dev/null | sort || true)

if [[ -z "$RESULTADOS" ]]; then
  echo "  (ninguna — función nueva)"
else
  echo "$RESULTADOS"
  ULTIMA=$(echo "$RESULTADOS" | tail -1 | cut -d: -f1)
  echo ""
  echo "⚠  Base correcta para la nueva migration: $(basename "$ULTIMA")"
fi

echo ""
