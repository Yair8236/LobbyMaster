-- LobbyMaster · endurecimiento de la base de datos (Fase 1) · PostgreSQL (Supabase)
-- Cierra lo que se puede cerrar sin cambiar el modelo de acceso (INC-03):
--   1) Quita privilegios que la web nunca usa (TRUNCATE, TRIGGER, REFERENCES) a anon y authenticated.
--   2) Reglas de negocio dentro de la base (no solo en el navegador): último administrador,
--      máximo de jugadores por equipo y cupos del torneo.
-- Limitación vigente: la web sigue usando la clave pública (anon) con políticas RLS abiertas; la
-- autorización por usuario real requeriría Supabase Auth (trabajo futuro, ver docs/SUPABASE.md).
-- Autor: Yair Anibal Mamani Ticona

-- 1) Privilegios mínimos: la web solo lee, inserta, actualiza y borra filas
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- 2a) Siempre debe existir al menos un administrador
CREATE OR REPLACE FUNCTION lm_proteger_ultimo_admin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.rol = 'admin' AND (TG_OP = 'DELETE' OR NEW.rol <> 'admin')
     AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.rol = 'admin' AND u.id_usuario <> OLD.id_usuario) THEN
    RAISE EXCEPTION 'Debe existir al menos un administrador' USING ERRCODE = 'P0001';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS tg_ultimo_admin_upd ON usuarios;
DROP TRIGGER IF EXISTS tg_ultimo_admin_del ON usuarios;
CREATE TRIGGER tg_ultimo_admin_upd BEFORE UPDATE OF rol ON usuarios FOR EACH ROW EXECUTE FUNCTION lm_proteger_ultimo_admin();
CREATE TRIGGER tg_ultimo_admin_del BEFORE DELETE ON usuarios FOR EACH ROW EXECUTE FUNCTION lm_proteger_ultimo_admin();

-- 2b) Un equipo tiene como máximo 8 jugadores en su roster
CREATE OR REPLACE FUNCTION lm_limite_roster() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM jugadores_roster r WHERE r.id_equipo = NEW.id_equipo AND r.id_roster <> NEW.id_roster) >= 8 THEN
    RAISE EXCEPTION 'El roster admite como máximo 8 jugadores' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_limite_roster ON jugadores_roster;
CREATE TRIGGER tg_limite_roster BEFORE INSERT OR UPDATE ON jugadores_roster FOR EACH ROW EXECUTE FUNCTION lm_limite_roster();

-- 2c) No se pueden aprobar más equipos que los cupos del torneo
CREATE OR REPLACE FUNCTION lm_limite_cupos() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND
     (SELECT count(*) FROM inscripciones i WHERE i.id_torneo = NEW.id_torneo AND i.estado = 'aprobado' AND i.id_inscripcion <> NEW.id_inscripcion)
       >= (SELECT t.cupos FROM torneos t WHERE t.id_torneo = NEW.id_torneo) THEN
    RAISE EXCEPTION 'Los cupos del torneo están completos' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_limite_cupos ON inscripciones;
CREATE TRIGGER tg_limite_cupos BEFORE INSERT OR UPDATE ON inscripciones FOR EACH ROW EXECUTE FUNCTION lm_limite_cupos();
