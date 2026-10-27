# Base de datos en Supabase · LobbyMaster

**Autor:** Yair Anibal Mamani Ticona

LobbyMaster guarda sus datos en **Supabase**, que es una base de datos **PostgreSQL** en la nube. Es una base relacional con SQL, igual que MySQL: las mismas 9 tablas, llaves primarias y foráneas, y las mismas restricciones. El archivo `database/schema.sql` es la versión para MySQL y `database/supabase_schema.sql` la de PostgreSQL.

## Cómo ver los datos
1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) con tu cuenta y abre el proyecto **lobbymaster**.
2. Menú **Table Editor**: aparecen `usuarios`, `juegos`, `sedes_mapa`, `torneos`, `equipos`, `jugadores_roster`, `inscripciones`, `enfrentamientos_brackets`, `resultados` y `bitacora`.
3. Menú **SQL Editor**: puedes ejecutar consultas, por ejemplo:
```sql
SELECT t.nombre AS torneo, j.nombre AS juego, s.nombre AS sede, t.estado
FROM torneos t
JOIN juegos j     ON j.id_juego = t.id_juego
JOIN sedes_mapa s ON s.id_sede  = t.id_sede
ORDER BY t.fecha;
```
Cada vez que registras algo en la plataforma (un torneo, una inscripción, un resultado), la fila aparece en la tabla correspondiente.

## Cómo se conecta la aplicación
- `frontend/js/config.js` tiene la dirección del proyecto y la clave **pública** («publishable»). Esa clave está pensada para ir en el navegador; lo que puede hacer lo limitan las políticas de seguridad (RLS) de la base.
- `frontend/js/sync.js` descarga las tablas al abrir la página y sube cada cambio. Arriba a la derecha, el botón de estado indica **Supabase conectado**, **Guardando…** o **Sin conexión · modo local**; al tocarlo se vuelve a sincronizar.
- Para trabajar sin la nube, pon `usarSupabase: false` en `config.js`.

## Usar otro proyecto de Supabase
1. Crea el proyecto y ejecuta, en este orden, `database/supabase_schema.sql` y `database/supabase_seed.sql` en el **SQL Editor**.
2. En *Project Settings → API* copia la URL y la clave *publishable* en `frontend/js/config.js`.

## Seguridad (honestidad)
Es un proyecto académico: las políticas permiten que la clave pública lea y escriba solo estas 10 tablas. Eso incluye los hashes de contraseñas (SHA-256 con sal), así que **no uses contraseñas reales**. En un sistema real se usaría Supabase Auth, políticas por rol y un backend para las reglas críticas.
