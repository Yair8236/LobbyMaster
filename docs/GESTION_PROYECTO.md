# Gestión del proyecto · LobbyMaster

**Responsable y único integrante:** Yair Anibal Mamani Ticona · Metodología XP (individual)

## 1. Herramientas

| Necesidad | Herramienta | Uso |
|---|---|---|
| Control de versiones | **Git** + **GitHub** | Repositorio, ramas, commits, pull requests, etiquetas de versión |
| Gestión de tareas | **Jira** (tablero Scrum) | Backlog, sprints, puntos de historia, tablero |
| Tareas dentro del repo | **GitHub Issues + Milestones** | Una issue por historia de usuario; un milestone por sprint |
| Integración continua | **GitHub Actions** | Ejecuta las pruebas en cada push y pull request |
| Documentación | Markdown en `docs/` y raíz | README, manual de usuario, arquitectura, changelog |

El backlog completo se importa a Jira con `docs/LobbyMaster_Jira_Import.csv` y a GitHub con `scripts/crear_issues.py`.

## 2. Tablero

Columnas: **Por hacer → En curso → En revisión (QA) → Hecho**. Límite de trabajo en curso (WIP) = 1.

Estado actual (Sprint 4 en curso, 20 de 44 puntos):

| Columna | Historias |
|---|---|
| Hecho | HU-01, HU-02, HU-03, HU-04, HU-05, HU-06 |
| En curso | HU-07 Marcador con avance de ronda |
| En revisión | HU-08 Campeón y estadísticas · HU-09 Mapa de sedes (mapa con OpenStreetMap y Google Maps) |
| Por hacer | HU-10, HU-11, pruebas finales y defensa |

## 3. Trazabilidad: historia → rama → versión

| Historia | Sprint | Rama de trabajo | Versión | Estado |
|---|---|---|---|---|
| Modelo de datos (9 tablas) | S1 | `feature/modelo-datos` | v0.1.0 | Hecho |
| HU-01 Registrar usuario · HU-02 Iniciar sesión con roles | S1 | `feature/HU-01-02-registro-login` | v0.1.0 | Hecho |
| HU-03 Crear torneo · HU-04 Inscribir equipo · HU-05 Aprobar inscripciones | S2–S3 | `feature/HU-03-04-05-torneos-inscripciones` | v0.2.0 | Hecho |
| HU-06 Generar bracket automático | S3 | `feature/HU-06-bracket` | v0.3.0 | Hecho |
| Integración continua | S3 | `feature/ci-pruebas` | v0.3.0 | Hecho |
| Manual de usuario, guía y plantillas | S4 | `docs/manual-y-gestion` | v0.3.0 | Hecho |
| HU-07 Marcador · HU-08 Campeón y estadísticas | S4 | `develop` (en revisión) | — | En curso |
| HU-09 Mapa de sedes | S5 | `feature/sedes-mapa` | v0.4.0 | En revisión |
| Base de datos en Supabase | S5 | `feature/supabase-bd` | v0.4.0 | En revisión |
| HU-10 Usuarios admin · HU-11 Historial | S5–S6 | — | — | Pendiente (hay adelantos en la beta) |

## 4. Participación individual

El proyecto es individual, por lo que todo el historial pertenece a un único autor. Se puede comprobar con:

```bash
./scripts/estadisticas_git.sh
```

También se ve en GitHub: *Insights → Contributors*, issues asignadas y pull requests con su autor.

## 5. Ciclo de trabajo de cada historia

1. Se toma la historia del tablero y se mueve a **En curso**.
2. Se crea la rama `feature/HU-xx-…` desde `develop`.
3. Se escribe primero la prueba y luego el código (TDD), con commits pequeños: `feat(...)`, `test(...)`.
4. Se abre el *Pull Request* con la plantilla; la integración continua corre las pruebas.
5. Se une a `develop`, se mueve a **Hecho** y, al cerrar el sprint, se etiqueta la versión.
