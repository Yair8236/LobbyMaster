-- LobbyMaster · modelo de datos (9 tablas + bitácora) · PostgreSQL (Supabase)
-- Es el mismo modelo de database/schema.sql (MySQL 8), con los tipos de PostgreSQL.
-- Autor: Yair Anibal Mamani Ticona

CREATE TABLE usuarios (
  id_usuario      integer PRIMARY KEY,
  nombre_usuario  varchar(20)  NOT NULL UNIQUE,
  correo          varchar(100) NOT NULL UNIQUE,
  contrasena_hash varchar(255) NOT NULL,
  rol             varchar(12)  NOT NULL DEFAULT 'jugador',
  CONSTRAINT ck_usuarios_rol CHECK (rol IN ('admin', 'organizador', 'jugador'))
);

CREATE TABLE juegos (
  id_juego integer PRIMARY KEY,
  nombre   varchar(40) NOT NULL UNIQUE
);

CREATE TABLE sedes_mapa (
  id_sede     integer PRIMARY KEY,
  nombre      varchar(60)   NOT NULL,
  direccion   varchar(120)  NULL,
  latitud     numeric(9, 6) NOT NULL,
  longitud    numeric(9, 6) NOT NULL,
  enlace_maps varchar(300)  NULL,
  CONSTRAINT ck_sedes_latitud  CHECK (latitud  BETWEEN -90  AND 90),
  CONSTRAINT ck_sedes_longitud CHECK (longitud BETWEEN -180 AND 180)
);

CREATE TABLE torneos (
  id_torneo      integer PRIMARY KEY,
  nombre         varchar(40) NOT NULL UNIQUE,
  fecha          date        NOT NULL,
  cupos          integer     NOT NULL,
  estado         varchar(12) NOT NULL DEFAULT 'abierto',
  id_juego       integer NOT NULL REFERENCES juegos (id_juego)    ON DELETE RESTRICT,
  id_sede        integer NOT NULL REFERENCES sedes_mapa (id_sede) ON DELETE RESTRICT,
  id_organizador integer NOT NULL REFERENCES usuarios (id_usuario),
  CONSTRAINT ck_torneos_cupos  CHECK (cupos BETWEEN 4 AND 32),
  CONSTRAINT ck_torneos_estado CHECK (estado IN ('abierto', 'en_curso', 'finalizado'))
);

CREATE TABLE equipos (
  id_equipo  integer PRIMARY KEY,
  nombre     varchar(24) NOT NULL UNIQUE,
  id_capitan integer NOT NULL REFERENCES usuarios (id_usuario)
);

CREATE TABLE jugadores_roster (
  id_roster integer PRIMARY KEY,
  id_equipo integer     NOT NULL REFERENCES equipos (id_equipo) ON DELETE CASCADE,
  nickname  varchar(30) NOT NULL
);

CREATE TABLE inscripciones (
  id_inscripcion integer PRIMARY KEY,
  id_torneo      integer     NOT NULL REFERENCES torneos (id_torneo) ON DELETE CASCADE,
  id_equipo      integer     NOT NULL REFERENCES equipos (id_equipo),
  estado         varchar(10) NOT NULL DEFAULT 'pendiente',
  CONSTRAINT uq_inscripcion UNIQUE (id_torneo, id_equipo),
  CONSTRAINT ck_inscripcion_estado CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'))
);

CREATE TABLE enfrentamientos_brackets (
  id_enfrentamiento integer PRIMARY KEY,
  id_torneo         integer NOT NULL REFERENCES torneos (id_torneo) ON DELETE CASCADE,
  ronda             integer NOT NULL,
  posicion          integer NOT NULL,
  id_equipo_a       integer NULL REFERENCES equipos (id_equipo),
  id_equipo_b       integer NULL REFERENCES equipos (id_equipo),
  id_ganador        integer NULL REFERENCES equipos (id_equipo),
  id_siguiente      integer NULL,
  CONSTRAINT uq_cruce UNIQUE (id_torneo, ronda, posicion),
  CONSTRAINT fk_enf_siguiente FOREIGN KEY (id_siguiente)
    REFERENCES enfrentamientos_brackets (id_enfrentamiento) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE resultados (
  id_resultado      integer PRIMARY KEY,
  id_enfrentamiento integer NOT NULL UNIQUE REFERENCES enfrentamientos_brackets (id_enfrentamiento) ON DELETE CASCADE,
  puntaje_a         integer NOT NULL,
  puntaje_b         integer NOT NULL,
  registrado_por    integer NOT NULL REFERENCES usuarios (id_usuario),
  fecha_registro    varchar(19) NOT NULL,
  CONSTRAINT ck_resultados_puntajes   CHECK (puntaje_a >= 0 AND puntaje_b >= 0),
  CONSTRAINT ck_resultados_sin_empate CHECK (puntaje_a <> puntaje_b)
);

-- Tabla auxiliar de auditoría (la usa el panel de Administración)
CREATE TABLE bitacora (
  id_bitacora bigint PRIMARY KEY,
  fecha       varchar(19)  NOT NULL,
  usuario     varchar(30)  NOT NULL,
  mensaje     varchar(300) NOT NULL
);

-- Seguridad a nivel de fila (RLS). Proyecto académico: la web usa la clave pública (anon)
-- y estas políticas le permiten leer y escribir solo estas tablas. Para producción se
-- reemplazaría por Supabase Auth y políticas por rol.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['usuarios','juegos','sedes_mapa','torneos','equipos','jugadores_roster','inscripciones','enfrentamientos_brackets','resultados','bitacora']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY acceso_demo_%1$s ON %1$I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
