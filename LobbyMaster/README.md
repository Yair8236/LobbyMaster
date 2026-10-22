# LobbyMaster · Beta 3

Plataforma web para organizar torneos de eSports (La Paz y El Alto, Bolivia): inscripciones, brackets automáticos de eliminación directa, resultados, estadísticas y administración por roles.

**Autor:** Yair Anibal Mamani Ticona · Proyecto universitario · Metodología XP (individual)

## Cómo probarla (sin instalar nada)
1. Descomprime el zip.
2. Abre `frontend/index.html` con doble clic (Chrome, Edge o Firefox). No necesita servidor ni internet (con internet carga las tipografías; sin internet usa las del sistema).
3. Entra con una cuenta de demostración o crea una cuenta nueva.

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
- Sedes con mapa esquemático por coordenadas.
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
| Controlador y reglas | `backend/src/` | `auth.js` (hash y permisos por rol), `bracket.js` (motor de brackets), `store.js` (reglas de negocio) |
| Modelo | `database/` | `schema.sql` (9 tablas, MySQL 8) |
| Pruebas | `tests/` | `bracket.test.js`, `store.test.js` |
| Documentación | `docs/` | arquitectura y diagrama ER |

`store.js` guarda los datos con la misma estructura de 9 tablas que `schema.sql`. En la beta persisten en el navegador (localStorage); en la versión final solo se reemplaza esa capa por MySQL/PostgreSQL con un servidor PHP o Node.js.

## Pruebas automáticas
```
node tests/bracket.test.js
node tests/store.test.js
```

## Limitaciones de la beta (honestas)
- No hay servidor: los datos viven en el navegador de quien la abre y no se comparten entre equipos.
- La seguridad de contraseñas y permisos es de demostración; en producción se valida en el servidor.
- El mapa es un esquema por coordenadas; la versión final usará Mapbox GL JS.
- Solo eliminación directa (doble eliminación y fase de grupos quedan para una versión posterior).
- Todos los datos y nombres de equipos, sedes y jugadores son ficticios.

## Convenciones del repositorio
Una rama por historia de usuario (`feature/HU-01-registrar-usuario`), commits pequeños que citan la historia, nada de credenciales en el código, nombres en minúsculas y sin espacios.
