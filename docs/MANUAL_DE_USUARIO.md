# Manual de usuario · LobbyMaster

**Autor:** Yair Anibal Mamani Ticona · **Versión del sistema:** 0.4.0 (Beta 4) · **Proyecto de Sistemas I, gestión 2-2026**

Este manual explica cómo usar LobbyMaster paso a paso. Cubre lo que está disponible en la Beta 4 y crecerá con cada sprint.

---

## 1. Qué es LobbyMaster

LobbyMaster es una página web para **organizar torneos de eSports** (videojuegos competitivos) en La Paz y El Alto. Con ella se puede:

- Crear torneos y recibir inscripciones de equipos.
- Aprobar o rechazar inscripciones.
- Generar automáticamente el **bracket** (el cuadro de partidas de eliminación directa).
- Registrar resultados, ver el avance del ganador y coronar al **campeón**.
- Consultar estadísticas, ranking y las sedes en un mapa, **sin necesidad de conocer coordenadas**.
- Guardar todos los datos en una **base de datos en la nube (Supabase)**, para verlos desde cualquier lugar.

## 2. Cómo abrirla

1. Descomprime la carpeta del proyecto (o clónala desde GitHub).
2. Abre el archivo `index.html` de la carpeta principal (o `frontend/index.html`) con doble clic. Funciona en Chrome, Edge o Firefox.
3. No necesita instalar nada. **Con internet** se conecta a la base de datos Supabase y carga el mapa; **sin internet** sigue funcionando con los datos guardados en tu navegador.

En la parte superior verás un indicador de conexión:

| Indicador | Significado |
|---|---|
| **Supabase conectado** (verde) | Tus cambios se guardan en la base de datos en la nube. |
| **Guardando…** | Se está enviando un cambio a la base. |
| **Sin conexión · modo local** | No hay internet: puedes seguir trabajando y los cambios se suben al reconectar. |

> Los datos del sistema viven en Supabase: las personas que abran la página ven la misma información. Para revisarlos directamente, abre el proyecto en Supabase → **Table Editor**.

## 3. Tipos de usuario (roles)

| Rol | Qué puede hacer |
|---|---|
| **Jugador** | Crear su equipo y su plantilla de jugadores, inscribir el equipo en torneos abiertos, ver brackets, ranking y estadísticas. |
| **Organizador** | Crear y administrar **sus** torneos: aprobar inscripciones, generar el bracket y registrar resultados. |
| **Administrador** | Todo lo anterior, más la gestión de usuarios y roles, juegos, sedes, datos y modelo de datos. |

### Cuentas de demostración

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `Admin2026` |
| Organizador | `organizador` | `Organiza2026` |
| Jugador | `jugador` | `Jugador2026` |

En la pantalla de ingreso también hay botones de acceso rápido para estas cuentas.

## 4. Ingresar o crear una cuenta

![Pantalla de ingreso](img/01_login.png)

**Para ingresar:** escribe tu usuario (o correo) y tu contraseña y pulsa **Entrar a LobbyMaster**.

**Para crear una cuenta:** pulsa la pestaña **Crear cuenta** y completa:

- **Usuario:** de 3 a 20 caracteres (letras, números o guion bajo).
- **Correo electrónico:** debe ser válido y no estar usado.
- **Contraseña:** mínimo 8 caracteres, con letras y números. Una barra te muestra qué tan fuerte es.
- **Repetir contraseña.**

Las cuentas nuevas son de **jugador**. Solo un administrador puede cambiar el rol.

**Si te equivocas varias veces:** tras 5 intentos fallidos la cuenta se bloquea 30 segundos por seguridad.

## 5. Conocer la pantalla

![Inicio](img/02_inicio.png)

- **Menú lateral:** Inicio, Torneos, Mis equipos, Sedes y mapa, Ranking y, si eres administrador, Administración y Modelo de datos.
- **Barra superior:** botón de tema claro/oscuro y **Mi cuenta** (aquí puedes cambiar tu contraseña).
- **Inicio:** muestra indicadores y tareas según tu rol (por ejemplo, inscripciones por aprobar).
- Para salir, usa el botón de cerrar sesión junto a tu nombre en el menú.

## 6. Guía para el jugador

### 6.1 Crear tu equipo
1. Entra a **Mis equipos** y pulsa **Crear equipo**.
2. Escribe el nombre (debe ser único) y agrega a tus jugadores (de 2 a 8). Tú quedas como **capitán**.

![Equipos](img/08_equipos.png)

### 6.2 Inscribir tu equipo en un torneo
1. Entra a **Torneos** y busca uno con estado **Abierto**. Puedes filtrar por juego o estado.
2. Abre el torneo y pulsa **Inscribir mi equipo** → **Enviar inscripción**.
3. Tu inscripción queda **Pendiente** hasta que el organizador la apruebe. Puedes verla en **Mis inscripciones** y retirarla si cambias de idea.

![Detalle de un torneo abierto](img/04_torneo_abierto.png)

Reglas: solo el capitán inscribe; un equipo no se inscribe dos veces en el mismo torneo ni en dos torneos el mismo día.

### 6.3 Ver el bracket, ranking y estadísticas
- Dentro de cada torneo, la pestaña **Bracket** muestra el cuadro de partidas y la pestaña **Estadísticas** los resultados del torneo.
- **Ranking** muestra los equipos con más títulos, victorias y efectividad.

## 7. Guía para el organizador

### 7.1 Crear un torneo
1. Entra a **Torneos** → **Nuevo torneo**.
2. Completa: nombre (5 a 40 caracteres, único), juego, sede, fecha (no pasada) y cupos (de 4 a 32).
3. Si la sede no existe todavía, pulsa **Nueva sede en el mapa** (ver sección 9) y vuelve al formulario.
4. Pulsa **Crear torneo**. El torneo queda **Abierto** para recibir inscripciones.

![Nuevo torneo](img/15_nuevo_torneo.png)

![Lista de torneos](img/03_torneos.png)

### 7.2 Aprobar inscripciones
1. Abre tu torneo y entra a la pestaña **Equipos e inscripciones**; ahí aparecen las **Inscripciones pendientes**.
2. Pulsa **Aprobar** o rechaza cada equipo. No se pueden aprobar más equipos que los cupos.

### 7.3 Generar el bracket
1. Cuando haya **al menos 4 equipos aprobados**, pulsa **Generar bracket**.
2. El sistema arma los cruces de **eliminación directa**. Si sobran lugares, algunos equipos reciben **BYE**: pasan directo a la siguiente ronda sin jugar.

![Bracket](img/05_bracket.png)

### 7.4 Registrar resultados
1. Haz clic en un cruce del bracket y escribe el puntaje de cada equipo (números de 0 a 99, sin empates).
2. Al guardar, el ganador avanza solo a la siguiente ronda.
3. Si te equivocaste, usa **Corregir resultado**. Si el cambio altera al ganador, el sistema **te avisa cuántas rondas siguientes se borrarán** y pide confirmación.

![Registrar un resultado](img/06_resultado.png)

### 7.5 Coronar al campeón
Cuando se juega la final, el torneo pasa a **Finalizado** y el campeón se destaca en el bracket y en las estadísticas.

![Campeón](img/12_campeon.png)

## 8. Guía para el administrador

![Administración](img/10_admin.png)

En **Administración** puedes:

- **Usuarios:** cambiar el rol o eliminar cuentas (siempre debe quedar al menos un administrador).
- **Juegos y sedes:** agregar o editar los catálogos (no se elimina uno que esté en uso). Las sedes se eligen en el mapa.
- **Bitácora:** ver las últimas acciones del sistema.
- **Datos:** exportar la información en SQL o JSON y **Restaurar datos de demostración**.

En **Modelo de datos** se muestran el diagrama entidad-relación, la normalización (sin normalizar → 1FN → 2FN → 3FN), el diccionario de datos y un explorador de las 9 tablas.

![Modelo de datos](img/11_modelo.png)

## 9. Sedes y mapa

Nadie necesita saber coordenadas: el lugar se elige en un mapa o se toma de Google Maps.

![Sedes y mapa](img/09_sedes.png)

**Ver una sede:** en **Sedes y mapa** toca un pin (o un nombre de la lista) para ver su dirección, los torneos que se juegan allí y los botones **Ver en Google Maps** y **Cómo llegar**.

**Crear una sede nueva** (organizador o administrador): pulsa **Nueva sede**, escribe el nombre y la dirección o referencia, y elige la ubicación de una de estas formas:

1. **Buscar:** escribe una calle, zona o lugar (por ejemplo, *Plaza Abaroa*), pulsa **Buscar** y elige el resultado correcto.
2. **Tocar el mapa:** arrastra el mapa, usa **+** y **−** para acercar y toca el lugar exacto; aparece el pin.
3. **Usar mi ubicación:** si estás en el lugar, el navegador coloca el pin por ti.
4. **Google Maps:** pulsa **Abrir Google Maps**, busca el lugar, copia el enlace largo de la barra de direcciones (o los números que aparecen al hacer clic derecho sobre el lugar) y pégalos en el campo **Pega aquí el enlace…**; pulsa **Usar**.

![Nueva sede](img/13_nueva_sede.png)

Cuando aparece **Lugar elegido**, pulsa **Guardar sede**. No se puede guardar una sede sin ubicación ni repetir un nombre. Los enlaces cortos (`maps.app.goo.gl`) no traen las coordenadas: abre el enlace y copia la dirección larga.

**En cada torneo:** la pestaña **Información** muestra la **Sede del torneo** en el mapa con los botones para abrirla en Google Maps.

![Sede del torneo](img/14_sede_torneo.png)

Editar o eliminar una sede es solo para el administrador. El mapa y la búsqueda necesitan internet.

## 10. Problemas frecuentes

| Problema | Qué hacer |
|---|---|
| «Usuario o contraseña incorrectos» | Revisa mayúsculas y minúsculas. Tras 5 fallos, espera 30 segundos. |
| No me deja inscribir mi equipo | Verifica que seas el capitán, que el torneo esté **Abierto**, que haya cupos y que no estés ya inscrito ese día. |
| No puedo generar el bracket | Necesitas al menos 4 equipos **aprobados** y ser el organizador del torneo (o administrador). |
| No veo el menú Administración | Es solo para administradores. |
| El indicador dice «Sin conexión · modo local» | Revisa tu internet. Puedes seguir trabajando; al reconectar (recarga la página) los cambios se suben a Supabase. |
| El mapa se ve en blanco o la búsqueda falla | Faltan los mosaicos del mapa por falta de internet. Aun así puedes pegar el enlace de Google Maps. |
| La pantalla se ve mal o dio un error | Recarga la página. Si persiste, un administrador puede usar **Restaurar datos de demostración**. |

## 11. Alcance de esta versión

Disponible hoy: registro e ingreso con roles, torneos, inscripciones, bracket automático, resultados, campeón, estadísticas, ranking, **sedes con mapa y Google Maps** y **base de datos en la nube (Supabase)**, además de la administración.

Limitaciones conocidas: la base está abierta para fines académicos, por lo que las cuentas de demostración no deben usar contraseñas reales; la recuperación de contraseña por correo y el panel avanzado del organizador quedan para próximos sprints.

---
*Manual elaborado por Yair Anibal Mamani Ticona · LobbyMaster v0.4.0*
