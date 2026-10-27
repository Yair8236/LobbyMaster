# LobbyMaster · Beta 4 (v0.4.0)

Plataforma web para organizar torneos de eSports (La Paz y El Alto, Bolivia): inscripciones, brackets automáticos de eliminación directa, resultados, estadísticas y administración por roles.

**Autor:** Yair Anibal Mamani Ticona · Proyecto universitario · Metodología XP (individual)

## Cómo ejecutarla
**Opción A · desde tu computadora (la más simple):** descarga o clona el repositorio y abre `frontend/index.html` con doble clic (Chrome, Edge o Firefox). Con internet se conecta sola a la base de datos de **Supabase** (arriba aparece «Supabase conectado»); sin internet funciona en modo local y sube los cambios al reconectar.

**Opción B · desde GitHub (GitHub Pages):** el repositorio ya trae un `index.html` en la raíz que abre la aplicación. En GitHub: *Settings → Pages → Deploy from a branch → `main` / `(root)`*. La web queda en `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`. En el plan gratuito de GitHub, Pages exige que el repositorio sea público.

**Opción C · con servidor local:** `python3 -m http.server 8000` en la raíz del repositorio y abre `http://localhost:8000/`.

Entra con una cuenta de demostración o crea una cuenta nueva.

| Rol | Usuario | Contraseña | Qué puede hacer |
|---|---|---|---|
| Administrador | `admin` | `Admin2026` | Todo: usuarios y roles, catálogos de juegos y sedes, datos, explorador de la base de datos |
| Organizador | `organizador` | `Organiza2026` | Crear torneos, aprobar inscripciones, generar el bracket, registrar resultados (solo de sus torneos) |
| Jugador | `jugador` | `Jugador2026` | Crear su equipo y roster, inscribirlo en torneos, ver brackets, ranking y estadísticas |

Otro organizador: `ceja_events` / `Organiza2026`. Capitanes de otros equipos: `wayna_pro`, `kuntur_gg`, `titi_lake`… todos con `Jugador2026`.

## Qué incluye
- Inicio con indicadores y tareas según el rol (inscripciones por aprobar, mis torneos, mi equipo).
- Torneos: lista con búsqueda y filtros, crear / editar / eliminar, cupos 4 a 32.
- Bracket visual de eliminación directa (4 a 32 equipos, BYE automáticos, avance del ganador, corrección de resultados con aviso del impacto, campeón, zoom, impresión).
- Inscripciones con estados pendiente / aprobado / rechazado y cupos controlados.
- Equipos con roster (2 a 8 jugadores) e historial de partidas.
- **Sedes con mapa real (OpenStreetMap)**: se elige el lugar buscándolo por nombre, tocando el mapa, usando tu ubicación o pegando el enlace de Google Maps; nadie necesita conocer coordenadas. Cada sede y cada torneo tienen botones **Ver en Google Maps** y **Cómo llegar**.
- **Base de datos en la nube (Supabase / PostgreSQL)**: todos los datos se guardan en las 9 tablas y se pueden ver desde el panel de Supabase (*Table Editor*).
- Estadísticas por torneo y ranking global (títulos, victorias, efectividad).
- Administración: usuarios, roles, juegos, bitácora, exportar SQL/JSON, restaurar datos de demostración.
- **Modelo de datos**: diagrama ER, normalización paso a paso (sin normalizar → 1FN → 2FN → 3FN), diccionario de datos, explorador de las 9 tablas con datos reales y consultas SQL de ejemplo.
- Tema oscuro / claro, diseño adaptable a celular.

## Validaciones y reglas de negocio
- Usuario 3–20 caracteres (letras, números, guion bajo), correo válido, contraseña de 8+ con letras y números; usuario y correo únicos.
- Contraseñas guardadas como hash SHA-256 con sal; bloqueo de 30 s tras 5 intentos fallidos.
- Torneo: nombre único (5–40), fecha no pasada, cupos 4–32, juego y sede existentes.
- Solo el capitán inscribe a su equipo; un equipo no se inscribe dos veces ni en dos torneos el mismo día.
- Solo el organizador del torneo (o un administrador) aprueba, genera el bracket y registra resultados.
- Mínimo 4 equipos aprobados para generar el bracket; sin empates; puntajes enteros de 0 a 99.
- Integridad referencial: no se elimina un juego, sede o usuario que esté en uso; siempre existe al menos un administrador.

## Arquitectura (MVC)
| Capa | Carpeta | Contenido |
|---|---|---|
| Vista | `frontend/` | `index.html`, `css/app.css`, `js/` (interfaz, bracket, pantallas) |
| Controlador y reglas | `backend/src/` | `auth.js` (hash y permisos por rol), `bracket.js` (motor de brackets), `store.js` (reglas de negocio), `geo.js` (ubicaciones y enlaces de Google Maps) |
| Modelo | `database/` | `schema.sql` (9 tablas, MySQL 8), `supabase_schema.sql` y `supabase_seed.sql` (PostgreSQL en Supabase) |
| Nube | `frontend/js/` | `config.js` (conexión), `sync.js` (sincronización con Supabase), `slippy.js` y `mapa.js` (mapa y selector de ubicación) |
| Pruebas | `tests/` | `bracket`, `store`, `geo` y `sync` |
| Documentación | `docs/` | arquitectura y diagrama ER |

`store.js` trabaja con la misma estructura de 9 tablas que `schema.sql`. Los datos se guardan en el navegador y se **sincronizan con Supabase** (PostgreSQL): al abrir la página se descargan las tablas y cada cambio sube solo las filas modificadas. Más detalle en [`docs/SUPABASE.md`](docs/SUPABASE.md).

## Repositorio y forma de trabajo
| Tema | Cómo se hace | Dónde verlo |
|---|---|---|
| **Ramas** | `main` (estable) · `develop` (integración) · `feature/HU-xx-nombre` (una por historia) · `docs/*` | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| **Commits** | Convención *Conventional Commits*: `tipo(ámbito): resumen [HU-xx]` | `git log --oneline` |
| **Pull Requests** | Plantilla con criterios y lista de verificación | `.github/PULL_REQUEST_TEMPLATE.md` |
| **Gestión de tareas** | Jira (tablero Scrum) + GitHub Issues y Milestones por sprint | [`docs/GESTION_PROYECTO.md`](docs/GESTION_PROYECTO.md) |
| **Versiones** | Versionado semántico con etiquetas `v0.1.0`, `v0.2.0`, `v0.3.0`, `v0.4.0` | [`CHANGELOG.md`](CHANGELOG.md) |
| **Participación individual** | Proyecto individual: todo el historial es de un autor; `./scripts/estadisticas_git.sh` lo muestra | `git shortlog -sne` |
| **Manual de usuario** | Manual inicial con capturas por rol | [`docs/MANUAL_DE_USUARIO.md`](docs/MANUAL_DE_USUARIO.md) |

## Estructura del repositorio
```
lobbymaster/
├── index.html           Abre la aplicación (útil para GitHub Pages)
├── frontend/            Vista: index.html, css/, js/ (interfaz, mapa, sincronización)
├── backend/src/         Controlador y reglas: auth.js, bracket.js, store.js, geo.js
├── database/            Modelo: schema.sql (MySQL), supabase_schema.sql y supabase_seed.sql (PostgreSQL)
├── tests/               Pruebas: bracket, store, geo y sync
├── docs/                Manual, arquitectura, gestión, diagrama ER, importación a Jira
├── scripts/             Issues, publicación y estadísticas de Git
├── .github/             Integración continua, plantillas de issues y pull requests
├── CONTRIBUTING.md      Ramas, commits y flujo de trabajo
├── CHANGELOG.md         Cambios por versión
└── README.md
```

## Pruebas automáticas
```
node tests/bracket.test.js
node tests/store.test.js
node tests/geo.test.js
node tests/sync.test.js
```

## Limitaciones de la beta (honestas)
- No hay servidor propio: la web habla directo con Supabase usando su clave pública y políticas abiertas de demostración (RLS). Por eso **usa solo contraseñas de prueba**: las filas de `usuarios` (con el hash de la contraseña) son legibles con esa clave. Para producción se usaría Supabase Auth con políticas por rol.
- Si dos personas editan a la vez, gana el último en guardar; el botón de estado (arriba) vuelve a descargar los datos.
- Los mosaicos del mapa vienen de OpenStreetMap y la búsqueda de lugares de Nominatim; ambos necesitan internet y un uso moderado.
- Solo eliminación directa (doble eliminación y fase de grupos quedan para una versión posterior).
- Todos los datos y nombres de equipos, sedes y jugadores son ficticios.

## Convenciones del repositorio
Una rama por historia de usuario (`feature/HU-01-registrar-usuario`), commits pequeños que citan la historia, nada de credenciales en el código, nombres en minúsculas y sin espacios.
