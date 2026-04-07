#!/bin/bash
# ============================================================
#  NextCore ERP — Setup EC2 (Amazon Linux 2023 / Ubuntu 22.04)
#  Ejecutar como root o con sudo:
#    chmod +x setup-ec2.sh && sudo ./setup-ec2.sh
# ============================================================
set -euo pipefail

echo "══════════════════════════════════════════════════"
echo "  NextCore ERP — Configuración de servidor EC2"
echo "══════════════════════════════════════════════════"

# ── Detectar SO ──────────────────────────────────────────
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  echo "❌ No se pudo detectar el sistema operativo"
  exit 1
fi

echo "→ Sistema detectado: $OS"

# ── 1. Actualizar sistema ───────────────────────────────
echo ""
echo "→ [1/5] Actualizando sistema..."
if [[ "$OS" == "amzn" ]]; then
  yum update -y
elif [[ "$OS" == "ubuntu" ]]; then
  apt-get update -y && apt-get upgrade -y
fi
echo "  ✔ Sistema actualizado"

# ── 2. Instalar Docker ──────────────────────────────────
echo ""
echo "→ [2/5] Instalando Docker..."
if ! command -v docker &> /dev/null; then
  if [[ "$OS" == "amzn" ]]; then
    yum install -y docker
    systemctl start docker
    systemctl enable docker
  elif [[ "$OS" == "ubuntu" ]]; then
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl start docker
    systemctl enable docker
  fi
  echo "  ✔ Docker instalado"
else
  echo "  ✔ Docker ya está instalado"
fi

# ── 3. Instalar Docker Compose ──────────────────────────
echo ""
echo "→ [3/5] Instalando Docker Compose..."
if ! docker compose version &> /dev/null; then
  if [[ "$OS" == "amzn" ]]; then
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
    curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
  fi
  # Ubuntu ya incluye docker-compose-plugin
  echo "  ✔ Docker Compose instalado"
else
  echo "  ✔ Docker Compose ya está instalado"
fi

# ── 4. Configurar usuario ───────────────────────────────
echo ""
echo "→ [4/5] Configurando permisos..."
# Agregar ec2-user o ubuntu al grupo docker
if id "ec2-user" &>/dev/null; then
  usermod -aG docker ec2-user
  APP_USER="ec2-user"
elif id "ubuntu" &>/dev/null; then
  usermod -aG docker ubuntu
  APP_USER="ubuntu"
else
  APP_USER=$(whoami)
fi
echo "  ✔ Usuario '$APP_USER' agregado al grupo docker"

# ── 5. Crear estructura del proyecto ────────────────────
echo ""
echo "→ [5/5] Creando directorios..."
APP_DIR="/opt/nextcore"
mkdir -p "$APP_DIR"
chown "$APP_USER":"$APP_USER" "$APP_DIR"
echo "  ✔ Directorio $APP_DIR creado"

# ── Resumen ─────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ Servidor configurado correctamente"
echo "══════════════════════════════════════════════════"
echo ""
echo "  Docker:         $(docker --version)"
echo "  Compose:        $(docker compose version 2>/dev/null || docker-compose --version 2>/dev/null)"
echo "  Directorio app: $APP_DIR"
echo ""
echo "  Próximos pasos:"
echo "  1. Sube tu código a $APP_DIR"
echo "  2. Copia .env.production como .env"
echo "  3. Ejecuta: cd $APP_DIR && docker compose up -d"
echo ""
echo "  Puertos que debes abrir en Security Group de EC2:"
echo "  ┌──────────┬──────────────────────────────────┐"
echo "  │ Puerto   │ Uso                              │"
echo "  ├──────────┼──────────────────────────────────┤"
echo "  │ 22       │ SSH                              │"
echo "  │ 3001     │ API NestJS                       │"
echo "  │ 15672    │ RabbitMQ Admin (opcional)         │"
echo "  └──────────┴──────────────────────────────────┘"
echo ""
echo "  ⚠️  NO abrir puertos 1433 (SQL), 6379 (Redis),"
echo "     5672 (AMQP) al público — solo acceso interno."
echo ""
