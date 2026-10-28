# Guía de GitHub · LobbyMaster

Cómo publicar y mantener el repositorio. **Autor:** Yair Anibal Mamani Ticona.

## 1. Publicar por primera vez

1. Instala [Git](https://git-scm.com/) y [GitHub CLI](https://cli.github.com/) y ejecuta `gh auth login`.
2. En la carpeta del proyecto ejecuta:
   ```bash
   chmod +x scripts/*.sh
   ./scripts/publicar_en_github.sh USUARIO_GITHUB_DEL_DOCENTE
   ```
   El script crea el repositorio, sube las ramas y etiquetas, invita al docente, crea las issues y abre el Pull Request pendiente.
3. Entra a `https://github.com/TU_USUARIO/LobbyMaster` y comprueba: *Code*, *Issues*, *Pull requests*, *Insights → Contributors* y *Releases/Tags*.

## 2. Publicar a mano (sin el script)

```bash
git remote add origin https://github.com/TU_USUARIO/LobbyMaster.git
git push -u origin --all
git push origin --tags
```
Luego, en GitHub: *Settings → Collaborators → Add people* para dar acceso al docente.

## 3. Trabajo diario

```bash
git switch develop
git switch -c feature/HU-07-marcador          # una rama por historia
# ... programar con commits pequeños ...
git commit -m "feat(resultados): registrar marcador y avanzar ganador [HU-07]"
git push -u origin feature/HU-07-marcador
gh pr create --base develop                    # abre el Pull Request
```

## 4. Publicar una versión

```bash
git switch main && git merge --no-ff develop
git tag -a v0.4.0 -m "LobbyMaster v0.4.0"
git push origin main --tags
```
Y actualiza el `CHANGELOG.md`.

## 5. Evidencia para la defensa

```bash
./scripts/estadisticas_git.sh
```
Muestra ramas, versiones, grafo de commits, commits por tipo y participación individual.
