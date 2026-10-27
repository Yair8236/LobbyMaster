-- LobbyMaster · modelo de datos (9 tablas) · MySQL 8
-- Autor: Yair Anibal Mamani Ticona
CREATE TABLE usuarios (
  id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario  VARCHAR(20)  NOT NULL UNIQUE,
  correo          VARCHAR(100) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol             VARCHAR(12)  NOT NULL DEFAULT 'jugador',
  CONSTRAINT ck_usuarios_rol CHECK (rol IN ('admin', 'organizador', 'jugador'))
);

CREATE TABLE juegos (
  id_juego INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE sedes_mapa (
  id_sede  INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(60)   NOT NULL,
  latitud  DECIMAL(9, 6) NOT NULL,
  longitud DECIMAL(9, 6) NOT NULL
);

CREATE TABLE torneos (
  id_torneo      INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(40) NOT NULL UNIQUE,
  fecha          DATE        NOT NULL,
  cupos          INT         NOT NULL,
  estado         VARCHAR(12) NOT NULL DEFAULT 'abierto',
  id_juego       INT NOT NULL,
  id_sede        INT NOT NULL,
  id_organizador INT NOT NULL,
  CONSTRAINT ck_torneos_cupos  CHECK (cupos BETWEEN 4 AND 32),
  CONSTRAINT ck_torneos_estado CHECK (estado IN ('abierto', 'en_curso', 'finalizado')),
  CONSTRAINT fk_torneos_juego  FOREIGN KEY (id_juego)       REFERENCES juegos (id_juego)     ON DELETE RESTRICT,
  CONSTRAINT fk_torneos_sede   FOREIGN KEY (id_sede)        REFERENCES sedes_mapa (id_sede)  ON DELETE RESTRICT,
  CONSTRAINT fk_torneos_org    FOREIGN KEY (id_organizador) REFERENCES usuarios (id_usuario)
);

CREATE TABLE equipos (
  id_equipo  INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(24) NOT NULL UNIQUE,
  id_capitan INT NOT NULL,
  CONSTRAINT fk_equipos_capitan FOREIGN KEY (id_capitan) REFERENCES usuarios (id_usuario)
);

CREATE TABLE jugadores_roster (
  id_roster INT AUTO_INCREMENT PRIMARY KEY,
  id_equipo INT         NOT NULL,
  nickname  VARCHAR(30) NOT NULL,
  CONSTRAINT fk_roster_equipo FOREIGN KEY (id_equipo) REFERENCES equipos (id_equipo) ON DELETE CASCADE
);

CREATE TABLE inscripciones (
  id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
  id_torneo      INT         NOT NULL,
  id_equipo      INT         NOT NULL,
  estado         VARCHAR(10) NOT NULL DEFAULT 'pendiente',
  CONSTRAINT uq_inscripcion UNIQUE (id_torneo, id_equipo),
  CONSTRAINT ck_inscripcion_estado CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  CONSTRAINT fk_inscr_torneo FOREIGN KEY (id_torneo) REFERENCES torneos (id_torneo) ON DELETE CASCADE,
  CONSTRAINT fk_inscr_equipo FOREIGN KEY (id_equipo) REFERENCES equipos (id_equipo)
);

CREATE TABLE enfrentamientos_brackets (
  id_enfrentamiento INT AUTO_INCREMENT PRIMARY KEY,
  id_torneo         INT NOT NULL,
  ronda             INT NOT NULL,
  posicion          INT NOT NULL,
  id_equipo_a       INT NULL,
  id_equipo_b       INT NULL,
  id_ganador        INT NULL,
  id_siguiente      INT NULL,
  CONSTRAINT uq_cruce UNIQUE (id_torneo, ronda, posicion),
  CONSTRAINT fk_enf_torneo    FOREIGN KEY (id_torneo)    REFERENCES torneos (id_torneo) ON DELETE CASCADE,
  CONSTRAINT fk_enf_equipo_a  FOREIGN KEY (id_equipo_a)  REFERENCES equipos (id_equipo),
  CONSTRAINT fk_enf_equipo_b  FOREIGN KEY (id_equipo_b)  REFERENCES equipos (id_equipo),
  CONSTRAINT fk_enf_ganador   FOREIGN KEY (id_ganador)   REFERENCES equipos (id_equipo),
  CONSTRAINT fk_enf_siguiente FOREIGN KEY (id_siguiente) REFERENCES enfrentamientos_brackets (id_enfrentamiento)
);

CREATE TABLE resultados (
  id_resultado      INT AUTO_INCREMENT PRIMARY KEY,
  id_enfrentamiento INT NOT NULL UNIQUE,
  puntaje_a         INT NOT NULL,
  puntaje_b         INT NOT NULL,
  registrado_por    INT NOT NULL,
  fecha_registro    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_resultados_puntajes CHECK (puntaje_a >= 0 AND puntaje_b >= 0),
  CONSTRAINT ck_resultados_sin_empate CHECK (puntaje_a <> puntaje_b),
  CONSTRAINT fk_res_enf FOREIGN KEY (id_enfrentamiento) REFERENCES enfrentamientos_brackets (id_enfrentamiento) ON DELETE CASCADE,
  CONSTRAINT fk_res_usuario FOREIGN KEY (registrado_por) REFERENCES usuarios (id_usuario)
);
