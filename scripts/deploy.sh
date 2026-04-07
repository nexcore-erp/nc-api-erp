#!/bin/bash
# ============================================================
#  NextCore ERP — Deploy / Redeploy en EC2
#  Ejecutar desde la carpeta del proyecto en el servidor:
#    chmod +x deploy.sh && ./deploy.sh
# ============================================================
set -euo pipefail

APP_DIR="/opt/nextcore"
cd "$APP_DIR"

echo "══════════════════════════════════════════════════"
echo "  NextCore ERP — Deploy"
echo "══════════════════════════════════════════════════"

# Verificar que .env existe
if [ ! -f .env ]; then
  echo "❌ Archivo .env no encontrado"
  echo "   Copia .env.production como .env y configura tus claves"
  exit 1
fi

echo "→ Construyendo imágenes..."
docker compose build --no-cache api

echo ""
echo "→ Levantando servicios..."
docker compose up -d

echo ""
echo "→ Esperando que los servicios estén saludables..."
sleep 10

echo ""
echo "→ Estado de los servicios:"
docker compose ps

echo ""
echo "→ Logs recientes de la API:"
docker compose logs --tail=20 api

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Deploy completado"
echo "══════════════════════════════════════════════════"
echo ""
echo "  API:           http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'TU_IP'):3001"
echo "  Swagger:       http://TU_IP:3001/api"
echo "  RabbitMQ:      http://TU_IP:15672"
echo ""
echo "  Comandos útiles:"
echo "    docker compose logs -f api      → Ver logs en tiempo real"
echo "    docker compose restart api      → Reiniciar solo la API"
echo "    docker compose down             → Detener todo"
echo "    docker compose up -d            → Levantar todo"
echo ""
