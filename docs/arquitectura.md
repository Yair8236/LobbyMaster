# Arquitectura de LobbyMaster (MVC)

- **Vista:** `frontend/`, interfaz web responsiva que se usa desde el celular.
- **Controlador:** `backend/src/`, validaciones, permisos por rol y motor de brackets.
- **Modelo:** `database/schema.sql`, 10 tablas relacionales con reglas de integridad.

El motor de brackets (`backend/src/bracket.js`) no depende de la interfaz ni de la base de datos, por eso se prueba con `tests/bracket.test.js`.

## v0.3.0 (Beta 3)
- `backend/src/auth.js`: SHA-256 con sal y matriz de permisos por rol (admin, organizador, jugador).
- `backend/src/store.js`: modelo de 10 tablas normalizadas, reglas de negocio y validaciones; persiste en localStorage y se sustituye por MySQL/PostgreSQL en la versión final.
- `frontend/js/`: vistas (inicio, torneos, bracket, equipos, sedes, ranking, administración, modelo de datos) construidas sin `innerHTML` con datos de usuario para evitar XSS.

## v0.4.0 (Beta 4)
- **Base de datos en la nube:** Supabase (PostgreSQL). Mismo modelo de 10 tablas (`database/supabase_schema.sql`) más una tabla auxiliar `bitacora`.
- **Sincronización:** `frontend/js/sync.js` descarga las tablas al abrir y sube solo las filas cambiadas (upsert y borrado respetando las llaves foráneas). Sin internet, la app trabaja en local y sube los cambios al reconectar.
- **Mapas:** `backend/src/geo.js` (matemática de mapas y lectura de enlaces de Google Maps), `frontend/js/slippy.js` (mapa propio sin librerías) y `frontend/js/mapa.js` (selector de ubicación).

## v1.0.0 (versión final)
- Nueva tabla `solicitudes_ingreso` (jugador → equipo, estados pendiente / aceptada / rechazada). Al aceptar, el apodo se agrega a `jugadores_roster`.
- `database/supabase_endurecimiento.sql`: privilegios mínimos para la clave pública y reglas dentro de la base (último administrador, máximo 8 jugadores por equipo, cupos del torneo).
- Limitación conocida (INC-03): sigue siendo una aplicación sin servidor propio; la autorización por rol se aplica en el navegador (`auth.js` / `store.js`). Una autorización real por usuario exigiría Supabase Auth con políticas RLS por rol.
