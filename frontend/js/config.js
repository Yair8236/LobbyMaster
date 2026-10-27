// LobbyMaster Beta 4 · configuración de la base de datos en la nube (Supabase / PostgreSQL).
// La clave "publishable" es pública por diseño: solo permite lo que las políticas RLS de la base autorizan.
// Autor: Yair Anibal Mamani Ticona
(function (root) {
  root.LOBBY_CONFIG = {
    supabaseUrl: 'https://cdsfxbvrxzuvangwpfph.supabase.co',
    supabaseKey: 'sb_publishable_WsQEjkY-j5aQYsB5YReOww_db7idjYE',
    // Para trabajar solo con el navegador (sin internet), pon false.
    usarSupabase: true
  };
})(this);
