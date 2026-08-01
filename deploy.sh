#!/usr/bin/env bash
# Script para enviar o projeto JC Hub para o servidor ignorando arquivos desnecessários

set -Eeuo pipefail

SERVER="${SERVER:-ubuntu@201.23.87.70}"
PROJECT_DIR="${PROJECT_DIR:-/home/ubuntu/jc-hub}"
LOCAL_DIR="${LOCAL_DIR:-/home/cardozo/Projects/jc-hub}"

# Se passar --kill, apenas para os containers
if [ "${1:-}" == "--kill" ]; then
  echo "💀 Parando containers no servidor..."
  ssh "$SERVER" "cd '$PROJECT_DIR' && docker compose down && echo 'Containers parados.'"
  exit 0
fi

echo "🚀 [1/3] Preparando diretório remoto ($SERVER:$PROJECT_DIR)..."
ssh "$SERVER" "mkdir -p '$PROJECT_DIR'"

echo "🚀 [2/3] Copiando arquivos para o servidor ($SERVER)..."

rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'venv' \
  --exclude '.git' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '.DS_Store' \
  "$LOCAL_DIR/" \
  "$SERVER:$PROJECT_DIR"

echo "✅ Cópia de arquivos concluída!"
echo "🚀 [3/3] Reiniciando containers no servidor..."

ssh "$SERVER" "PROJECT_DIR='$PROJECT_DIR' bash -se" << 'EOF'
  set -Eeuo pipefail

  cd "$PROJECT_DIR"

  if ! command -v docker >/dev/null 2>&1; then
    echo "ERRO: docker não está instalado na VM." >&2
    echo "Instale Docker e o plugin Docker Compose na VM antes de rodar o deploy." >&2
    exit 127
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo "ERRO: docker compose não está disponível na VM." >&2
    echo "Instale o plugin Docker Compose na VM antes de rodar o deploy." >&2
    exit 127
  fi

  echo "--- Rebuilding e subindo containers..."
  docker compose down
  docker compose build --no-cache
  docker compose up -d

  echo "--- Containers em execução:"
  docker compose ps
EOF

echo "✅ Deploy finalizado com sucesso!"
