# Despliegue en Dokploy (Docker Compose)

Este documento explica paso a paso cómo desplegar la aplicación "Álbum de Figuritas" en Dokploy usando `docker-compose.yml` incluido en el repositorio.

Contenido:
- Requisitos
- Preparar el repositorio y `.env`
- Despliegue en Dokploy (paso a paso)
- Opciones para que la SPA acceda a la API (proxy nginx o Traefik)
- Pruebas y verificación
- Despliegue/rollback local con Docker Compose
- Troubleshooting

---

## 1) Requisitos

- Cuenta en Dokploy y acceso a su panel (para crear un proyecto Compose).
- Dominio propio (ej. `mi-dominio.com`) con DNS apuntando al endpoint que Dokploy indique.
- Repositorio Git accesible (GitHub/GitLab/Bitbucket) o un zip con el código.
- Opcional para pruebas locales: Docker y Docker Compose.

## 2) Archivos importantes

- Composición principal: [docker-compose.yml](docker-compose.yml)
- Backend: [backend/Dockerfile](backend/Dockerfile) y [backend/src/seed.ts](backend/src/seed.ts)
- Frontend: [frontend/Dockerfile](frontend/Dockerfile) y [frontend/nginx.conf](frontend/nginx.conf)
- Configuración de Vite (proxy dev): [frontend/vite.config.ts](frontend/vite.config.ts)
- Conexión BD (código): [backend/src/db.ts](backend/src/db.ts)

## 3) Preparar el repositorio antes de desplegar

1. El repositorio está preconfigurado para usar el dominio `album.abadgroup.tech`.

   Si quieres usar otro dominio, reemplaza `album.abadgroup.tech` en `docker-compose.yml` por tu dominio real.

   Línea relevante en `docker-compose.yml`:

   ```yaml
   - 'traefik.http.routers.album.rule=Host(`album.abadgroup.tech`)'
   ```

2. Prepara las variables de entorno. Crea un archivo local `.env` (NO subirlo al repo) con las variables necesarias o guarda estos valores en la UI de Dokploy.

   Ejemplo de `.env` mínimo:

   ```env
   POSTGRES_USER=album_user
   POSTGRES_PASSWORD=change_me
   POSTGRES_DB=album_db
   VITE_API_URL=/api
   ```

   Recomendación: para producción use valores seguros para `POSTGRES_PASSWORD` y administre secretos desde Dokploy.

3. Nota sobre `DATABASE_URL`: el `docker-compose.yml` ya construye `DATABASE_URL` para `api-server` a partir de `POSTGRES_*`. No es necesario definir `DATABASE_URL` manualmente si tiene `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`.

## 4) Despliegue en Dokploy (paso a paso)

1. Haz commit y push de los cambios (por ejemplo, haber reemplazado `TU_DOMINIO`):

   ```bash
   git add docker-compose.yml
   git commit -m "Config Dokploy: dominio y env"
   git push origin main
   ```

2. En Dokploy: `New Project` → `Compose`.

   - Pega la URL del repositorio (o sube los archivos) y selecciona la rama (ej. `main`).
   - Dokploy leerá el archivo `docker-compose.yml` en la raíz.

3. En Dokploy, configura las variables de entorno (si no subes `.env`):

   - `POSTGRES_USER` = `album_user` (ejemplo)
   - `POSTGRES_PASSWORD` = `valor-secreto` (obligatorio, usar secreto)
   - `POSTGRES_DB` = `album_db`
   - `VITE_API_URL` = `/api`  

   Nota: usar `VITE_API_URL=/api` permite que la SPA haga peticiones relativas y se aproveche de un proxy interno (ver siguiente sección).

4. Asegúrate de que el dominio `album.abadgroup.tech` está configurado en `docker-compose.yml` o ajústalo si deseas usar otro dominio.

5. Lanza el deploy en Dokploy y espera a que las imágenes se construyan y los servicios queden saludables. Verifica logs de `postgres` y `api-server` en el panel.

6. DNS y HTTPS: configura el DNS para apuntar `album.abadgroup.tech` al endpoint que Dokploy indique. Traefik (configurado en `docker-compose.yml`) gestionará certificados LetsEncrypt automáticamente si el dominio apunta correctamente.

## 5) Opciones para que la SPA acceda a la API (importante)

El `docker-compose.yml` que usamos marca `api-server` con `traefik.enable=false` (acceso interno). Esto evita exponer directamente el backend a Internet. Para que el frontend (navegador) pueda llamar a la API tienes dos opciones — elige una:

### Opción A (recomendada si quieres mantener el backend interno): configurar nginx del `vue-app` para que haga proxy de `/api` hacia `api-server`.

1. Modifica `frontend/nginx.conf` para añadir un bloque `location /api/` que haga `proxy_pass` a `http://api-server:3000` (el nombre `api-server` funciona dentro de la red Compose).

   Ejemplo (agrega dentro del `server`):

   ```nginx
   location /api/ {
     proxy_pass http://api-server:3000/;
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   }
   ```

2. Mantén `VITE_API_URL=/api` al construir la SPA (o usa `https://album.abadgroup.tech/api` si prefieres URL absoluta).

3. Reconstruye la imagen `frontend` y despliega: Dokploy lo hará automáticamente tras el push.

Con esto, el navegador hace peticiones a `https://TU_DOMINIO/api/...`, esas peticiones llegan al `vue-app` (Traefik) y `nginx` dentro del `vue-app` las reenvía a `api-server` dentro de la red interna.

### Opción B (exponer la API mediante Traefik)

Si prefieres que Traefik gestione directamente el enrutado de `/api`, quita `traefik.enable=false` del servicio `api-server` en `docker-compose.yml` y añade etiquetas de Traefik que hagan match con `Host("TU_DOMINIO") && PathPrefix(`/api`)` (o `HostRegexp`) — así Traefik expondrá el backend en `https://TU_DOMINIO/api`.

**Nota:** exponer la API a Internet tiene implicaciones de seguridad; asegúrate de aplicar controles si decides hacerlo.

## 6) Verificación después del despliegue

- En Dokploy revisa los logs de `api-server` y `postgres` por errores.
- Abre en el navegador `https://album.abadgroup.tech` y verifica que la SPA carga.
- Desde el navegador (o `curl`) verifica una ruta API pública (ej. `/api/summary`):

```bash
curl -i https://album.abadgroup.tech/api/summary
```

Si recibes JSON con `category`, `total`, `got`, `missing` la integración es correcta.

## 7) Pruebas locales (desarrollo)

Si quieres probar todo en tu máquina antes de subirlo a Dokploy:

1) Opción rápida: ejecutar servicios por separado en dev

Backend (con Postgres local):

```bash
# Inicia Postgres localmente (ejemplo)
docker run --name album-pg -e POSTGRES_USER=album_user -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=album_db -p 5432:5432 -d postgres:16-alpine

cd backend
export DATABASE_URL="postgresql://album_user:pass@localhost:5432/album_db"
npm install
npm run seed   # pobla la DB
npm run dev    # inicia servidor en http://localhost:3000
```

Frontend (dev):

```bash
cd frontend
export VITE_API_URL=http://localhost:3000
npm install
npm run dev    # abre en http://localhost:5173
```

2) Opción con Docker Compose local (override para exponer puertos)

Si quieres usar `docker compose` local y exponer puertos para testear, crea un archivo `docker-compose.override.yml` con overrides de puertos:

```yaml
services:
  postgres:
    ports:
      - "5432:5432"
  api-server:
    ports:
      - "3000:3000"
  vue-app:
    ports:
      - "8080:80"
```

Y ejecuta:

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

La SPA quedará accesible en `http://localhost:8080` y la API en `http://localhost:3000`.

## 8) Rollback / limpieza local

```bash
docker compose down --volumes --remove-orphans
docker rm -f album-pg || true
docker volume ls | grep pgdata && docker volume rm <volume-name>
```

## 9) Troubleshooting común

- Seed falla con error de conexión: esperar a que `postgres` esté listo (`docker compose logs -f postgres`) y reintentar `npm run seed`.
- Error de compilación frontend: revisar `VITE_API_URL` y reconstruir (`npm run build` en `frontend`).
- Si la SPA no recibe datos, verificar si `nginx` del `vue-app` está proxying `/api` correctamente o si `api-server` está expuesto por Traefik según la opción elegida.

---

Si quieres, puedo:
- Crear un example `.env.example` en el repo con las variables base.
- Modificar `frontend/nginx.conf` para incluir el bloque `location /api/` y hacer push.
- Ejecutar una prueba local con `docker compose` (requiere Docker disponible).

Archivo creado: [docker-compose.yml](docker-compose.yml) (comprobar que el dominio configurado es `album.abadgroup.tech` o cámbialo por el tuyo)
