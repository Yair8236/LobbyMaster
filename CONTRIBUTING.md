# Guía de contribución · LobbyMaster

Normas de trabajo del repositorio. Aunque el proyecto es individual (autor: **Yair Anibal Mamani Ticona**), se trabaja como equipo profesional para que el proceso sea ordenado y repetible.

## 1. Ramas

| Rama | Para qué sirve | ¿Se trabaja directo? |
|---|---|---|
| `main` | Versión estable y entregada. Cada versión lleva una etiqueta (`v0.1.0`, `v0.2.0`…). | No. Solo recibe *Pull Requests* desde `develop`. |
| `develop` | Integración: aquí se unen las historias terminadas. | No. Recibe ramas `feature/*`. |
| `feature/HU-xx-nombre` | Una historia de usuario (por ejemplo `feature/HU-06-bracket`). | Sí. |
| `docs/nombre` | Cambios solo de documentación. | Sí. |
| `fix/nombre` | Corrección de un error. | Sí. |

Flujo: `feature/*` → *Pull Request* → `develop` → *Pull Request* de versión → `main` (+ etiqueta).

## 2. Convención de commits (Conventional Commits)

Formato:

```
tipo(ámbito): resumen corto en infinitivo [HU-xx]

Explicación opcional de qué y por qué.
```

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad (una historia de usuario) |
| `fix` | Corrección de un error |
| `docs` | Documentación |
| `test` | Pruebas |
| `refactor` | Ordenar código sin cambiar lo que hace |
| `style` | Formato o estilos, sin cambiar la lógica |
| `ci` | Integración continua |
| `chore` | Tareas de mantenimiento |

Ejemplos reales de este proyecto:

```
feat(auth): iniciar sesión con roles y permisos [HU-02]
feat(bracket): generar cuadro de eliminación directa con BYE [HU-06]
test(store): probar reglas de inscripción y cupos [HU-04]
docs(manual): agregar manual de usuario inicial
```

## 3. Pull Requests

1. Crear la rama desde `develop`: `git switch -c feature/HU-xx-nombre develop`.
2. Hacer commits pequeños siguiendo la convención.
3. Subir la rama y abrir el *Pull Request* hacia `develop` usando la plantilla.
4. Revisar la lista de verificación (pruebas en verde, criterios cumplidos).
5. Unir (*merge*) y borrar la rama.

## 4. Issues y tablero

- Cada historia de usuario es un **issue** con su etiqueta de prioridad (`must`, `should`, `could`) y su **milestone** (Sprint 1 a Sprint 6).
- El nombre de la rama y los commits citan el número de la historia (`HU-xx`).
- Tablero: *Por hacer → En curso → En revisión → Hecho*, con un máximo de **1 historia en curso** (WIP = 1).

## 5. Definición de Hecho

Una historia está terminada cuando: cumple sus criterios de aceptación, las pruebas pasan (`node tests/bracket.test.js` y `node tests/store.test.js`), se revisó el código con la lista del PR y se mostró en la demo del sprint.

## 6. Versionado

Se usa **versionado semántico** `MAJOR.MINOR.PATCH`:

- `0.1.0` → Sprint 1: acceso y modelo de datos.
- `0.2.0` → Torneos e inscripciones.
- `0.3.0` → Bracket automático, pruebas e integración continua (**Beta 3**).

Los cambios de cada versión están en [`CHANGELOG.md`](CHANGELOG.md).

## 7. Seguridad

No subir contraseñas, claves ni archivos `.env`. Las contraseñas de los usuarios se guardan con *hash* y sal.
