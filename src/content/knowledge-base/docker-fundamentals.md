---
title: "Docker Fundamentals: Guía Completa de Contenedores"
description: "Aprende los conceptos fundamentales de Docker y containerización con esta guía completa que incluye ejemplos prácticos y mejores prácticas."
excerpt: "Una guía completa que cubre desde los conceptos básicos de Docker hasta técnicas avanzadas de contenedorización. Incluye ejemplos prácticos, comandos esenciales y mejores prácticas para desarrollo y producción."
pubDate: 2025-05-27
updatedDate: 2025-05-27
author:
  name: "Carlos Rodríguez"
  avatar: "/avatars/carlos.jpg"
  bio: "DevOps Engineer con 5+ años de experiencia"
category: "devops"
tags: ["docker", "contenedores", "devops", "linux", "deployment"]
ranking: 5
heroImage: "/knowledge-base/docker-fundamentals.jpg"
readingTime: "15 min"
prerequisites:
  - "Conocimientos básicos de Linux/Terminal"
  - "Conceptos básicos de desarrollo de software"
  - "Familiaridad con línea de comandos"
objectives:
  - "Entender qué es Docker y por qué es útil"
  - "Aprender a crear y gestionar contenedores"
  - "Dominar los comandos esenciales de Docker"
  - "Crear Dockerfiles personalizados"
  - "Implementar mejores prácticas de seguridad"
attachments:
  - title: "Docker Fundamentals - Guía Completa PDF"
    type: "pdf"
    url: "/downloads/docker-fundamentals-guide.pdf"
    description: "Guía completa en PDF con todos los conceptos y comandos"
    size: "3.2 MB"
  - title: "Docker Cheat Sheet"
    type: "pdf"
    url: "/downloads/docker-cheatsheet.pdf"
    description: "Hoja de referencia rápida con comandos esenciales"
    size: "1.1 MB"
  - title: "Ejemplos de Dockerfile"
    type: "code"
    url: "https://github.com/codevs/docker-examples"
    description: "Repositorio con ejemplos prácticos de Dockerfiles"
resources:
  - title: "Documentación Oficial de Docker"
    url: "https://docs.docker.com/"
    type: "documentation"
  - title: "Docker Hub"
    url: "https://hub.docker.com/"
    type: "tool"
  - title: "Play with Docker"
    url: "https://labs.play-with-docker.com/"
    type: "tutorial"
---

## ¿Qué es Docker?

Docker es una plataforma de contenedorización que permite empaquetar aplicaciones y sus dependencias en contenedores ligeros y portables. Esto garantiza que tu aplicación funcione de manera consistente en cualquier entorno.

### Conceptos Clave

**Contenedor**: Una unidad de software que empaqueta código y dependencias para que la aplicación se ejecute de forma rápida y confiable.

**Imagen**: Una plantilla de solo lectura utilizada para crear contenedores.

**Dockerfile**: Un archivo de texto que contiene instrucciones para construir una imagen de Docker.

## Instalación y Configuración

### Linux (Ubuntu/Debian)

```bash
# Actualizar repositorios
sudo apt update

# Instalar Docker
sudo apt install docker.io

# Iniciar y habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Añadir usuario al grupo docker
sudo usermod -aG docker $USER
```

### Verificar Instalación

```bash
# Verificar versión
docker --version

# Ejecutar contenedor de prueba
docker run hello-world
```

## Comandos Esenciales

### Gestión de Imágenes

```bash
# Listar imágenes
docker images

# Descargar imagen
docker pull nginx:latest

# Eliminar imagen
docker rmi nginx:latest

# Construir imagen desde Dockerfile
docker build -t mi-app:v1.0 .
```

### Gestión de Contenedores

```bash
# Ejecutar contenedor
docker run -d --name mi-nginx -p 80:80 nginx

# Listar contenedores activos
docker ps

# Listar todos los contenedores
docker ps -a

# Detener contenedor
docker stop mi-nginx

# Iniciar contenedor
docker start mi-nginx

# Eliminar contenedor
docker rm mi-nginx
```

## Creando tu Primer Dockerfile

### Ejemplo: Aplicación Node.js

```dockerfile
# Usar imagen base oficial de Node.js
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar a usuario no-root
USER nextjs

# Comando de inicio
CMD ["npm", "start"]
```

### Ejemplo: Aplicación Python

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Crear usuario no-root
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

EXPOSE 8000

CMD ["python", "app.py"]
```

## Docker Compose

Para aplicaciones multi-contenedor, usa Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Ejecutar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs

# Detener servicios
docker-compose down
```

## Mejores Prácticas

### Seguridad

1. **Nunca uses el usuario root**
2. **Mantén las imágenes actualizadas**
3. **Usa imágenes oficiales y verificadas**
4. **Escanea imágenes en busca de vulnerabilidades**

```bash
# Escanear imagen con Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image mi-app:latest
```

### Optimización

1. **Usa multi-stage builds**
2. **Minimiza el número de capas**
3. **Aprovecha la caché de Docker**
4. **Usa .dockerignore**

```dockerfile
# Multi-stage build ejemplo
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]
```

### .dockerignore

```gitignore
node_modules
npm-debug.log
.git
.env
Dockerfile
README.md
.dockerignore
```

## Troubleshooting Común

### Problema: Puerto ya en uso
```bash
# Encontrar proceso usando el puerto
sudo lsof -i :8080

# Matar proceso
sudo kill -9 <PID>
```

### Problema: Espacio en disco
```bash
# Limpiar contenedores parados
docker container prune

# Limpiar imágenes sin usar
docker image prune

# Limpieza completa
docker system prune -a
```

### Problema: Permisos
```bash
# Reiniciar Docker daemon
sudo systemctl restart docker

# Verificar permisos de grupo
groups $USER
```

## Monitoreo y Logs

```bash
# Ver logs de contenedor
docker logs -f mi-contenedor

# Estadísticas en tiempo real
docker stats

# Inspeccionar contenedor
docker inspect mi-contenedor

# Ejecutar comando en contenedor activo
docker exec -it mi-contenedor /bin/bash
```

## Conclusión

Docker es una herramienta fundamental en el desarrollo moderno que simplifica el despliegue y la gestión de aplicaciones. Con esta guía has aprendido:

- ✅ Conceptos fundamentales de Docker
- ✅ Comandos esenciales para el día a día
- ✅ Creación de Dockerfiles optimizados
- ✅ Mejores prácticas de seguridad
- ✅ Técnicas de troubleshooting

**Próximos pasos recomendados:**
1. Practica con los ejemplos del repositorio adjunto
2. Explora Docker Swarm para orquestación
3. Aprende Kubernetes para gestión avanzada de contenedores
4. Implementa CI/CD con Docker

¡Sigue practicando y experimentando con Docker para dominar completamente esta tecnología!