# Registro de cambios · LobbyMaster

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado semántico.

## [Sin publicar]
### En curso (Sprint 4)
- HU-07: marcador con avance de ronda (en revisión).
- HU-08: campeón y estadísticas (en revisión).

## [0.4.0] · Beta 4
### Agregado
- Base de datos real en **Supabase (PostgreSQL)** con las 9 tablas, llaves foráneas, restricciones y seguridad de filas; datos de demostración cargados (`database/supabase_*.sql`).
- Sincronización automática de la aplicación con la base (`frontend/js/sync.js`): descarga al abrir, sube solo lo que cambió, modo sin conexión y botón de estado.
- Sedes con **mapa propio sobre OpenStreetMap**: buscar el lugar, tocar el mapa, usar mi ubicación o pegar el enlace de Google Maps; botones «Ver en Google Maps» y «Cómo llegar» (HU-09, en revisión).
- Las sedes ahora guardan dirección y enlace de Google Maps; los organizadores pueden crear sedes desde el formulario de torneo.
- `index.html` en la raíz para publicar con GitHub Pages; pruebas `geo` y `sync` en la integración continua.
### Cambiado
- Las sedes ya no piden escribir latitud y longitud.
- Los diálogos largos mantienen visibles el título y los botones.
### Corregido
- La sincronización acepta respuestas vacías (201/204) de la API de Supabase.

## [0.3.0] · Beta 3
### Agregado
- Bracket de eliminación directa para 4 a 32 equipos con BYE automáticos (HU-06).
- Vista visual del bracket con zoom e impresión.
- Registro de resultados con avance del ganador y corrección con aviso de impacto.
- Pruebas del motor de brackets (`tests/bracket.test.js`).
- Integración continua con GitHub Actions.
- Manual de usuario inicial, guía de contribución y plantillas de issues y pull requests.

## [0.2.0] · Beta 2
### Agregado
- Creación y edición de torneos con validaciones (HU-03).
- Inscripción de equipos con cupos y reglas de negocio (HU-04).
- Aprobación y rechazo de inscripciones (HU-05).
- Pruebas de las reglas de negocio (`tests/store.test.js`).

## [0.1.0] · Beta 1
### Agregado
- Modelo de datos de 9 tablas normalizadas hasta 3FN (`database/schema.sql`) y diagrama ER.
- Registro de usuarios con validaciones (HU-01).
- Inicio de sesión con roles jugador, organizador y administrador, contraseñas con hash y sal (HU-02).
- Estructura MVC del proyecto y README.
