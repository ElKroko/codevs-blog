# Guía Rápida de Funcionamiento

Esta documentación explica de forma sencilla cómo está armado el proyecto **CODEVS** y cuál es el rol de cada parte.

## 1. ¿Qué es Astro?
Astro es una herramienta que permite crear sitios web estáticos. Genera archivos HTML listos para ser servidos en cualquier hosting. En este proyecto, Astro se encarga de construir todo el frontend.

## 2. ¿Qué es WordPress?
WordPress es un sistema de gestión de contenido (CMS). Aquí se usa solo como backend para almacenar posts y páginas. A través de su API REST se consulta la información que luego se muestra en el sitio.

## 3. Arquitectura General
- **WordPress** vive en `cms.kroko.cl` y expone una API REST.
- **Astro** consume esa API desde los archivos de `src/lib/wp.ts`.
- Si WordPress falla, el sitio usa datos de respaldo definidos en `src/lib/fallback-data.ts`.
- El resultado final es un sitio estático que se sube a `codevs.kroko.cl`.

Diagrama simplificado:
```
WordPress (cms.kroko.cl) ──→ API REST ──→ Astro ──→ Archivos estáticos ──→ Usuario
                                      ↘
                                       fallback-data.ts (si la API falla)
```

## 4. Estructura de Carpetas Relevantes
- `src/` – código fuente del frontend.
  - `components/` – piezas reutilizables de la interfaz.
  - `pages/` – cada archivo `.astro` es una página del sitio.
  - `lib/wp.ts` – funciones para obtener datos de WordPress.
  - `lib/fallback-data.ts` – datos que se usan cuando la API no responde.
- `docs/` – guías y documentación adicional.
- `wordpress/` – configuraciones o snippets que se agregan al WordPress real.

## 5. Flujo de Datos
1. Durante el **build** (`npm run build` o `npm run deploy`), Astro ejecuta las funciones de `src/lib/wp.ts`.
2. Estas funciones llaman a la API de WordPress para obtener páginas y posts.
3. Si la API no responde, se utiliza el contenido de `fallback-data.ts`, de modo que el sitio sigue funcionando.
4. Una vez construido, todos los archivos quedan en la carpeta `dist/` listos para desplegarse de forma estática.

## 6. Despliegue Básico
Existen varios scripts de ayuda (ver `docs/DEPLOY-GUIDE.md`), pero el flujo típico es:
```bash
npm install
npm run deploy
```
Ese comando genera un paquete `.zip` con la última versión del sitio. Luego se sube el contenido de `dist/` al servidor de hosting.

## 7. ¿Dónde editar el contenido?
- **En WordPress**: desde `cms.kroko.cl/wp-admin` se pueden crear nuevos posts o páginas que la API expondrá automáticamente.
- **En Astro**: también existen posts escritos en Markdown dentro de `src/content/blog/`. Esos archivos se procesan durante el build y conviven con los artículos de WordPress.

## 8. Recomendaciones Finales
- Mantén actualizadas las variables de entorno que apuntan al dominio de WordPress.
- Si el backend presenta problemas, el sitio seguirá mostrando el contenido de fallback, pero conviene revisar los logs de WordPress para corregirlos.
- Para más detalles sobre los scripts de despliegue o resolución de errores, consulta los archivos dentro de la carpeta `docs/`.

