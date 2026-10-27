#!/usr/bin/env bash
# Publica el repositorio en GitHub con todas sus ramas y etiquetas, invita al docente,
# crea las issues del backlog y abre el Pull Request pendiente.
#
# Requisitos: GitHub CLI (gh) instalado y sesión iniciada (gh auth login).
# Uso:   ./scripts/publicar_en_github.sh [USUARIO_GITHUB_DEL_DOCENTE]
# Autor: Yair Anibal Mamani Ticona
set -e
cd "$(dirname "$0")/.."
DOCENTE="${1:-}"

echo ">> Creando el repositorio LobbyMaster en tu cuenta y subiendo ramas..."
gh repo create LobbyMaster --public --source . --remote origin \
  --description "Plataforma web para organizar torneos de eSports: inscripciones, brackets automáticos y estadísticas" \
  --push
git push origin --all
git push origin --tags

USUARIO=$(gh api user --jq .login)
echo ">> Repositorio: https://github.com/$USUARIO/LobbyMaster"

if [ -n "$DOCENTE" ]; then
  echo ">> Invitando a $DOCENTE como colaborador/a..."
  gh api -X PUT "repos/$USUARIO/LobbyMaster/collaborators/$DOCENTE" -f permission=push >/dev/null
fi

echo ">> Creando issues, etiquetas y milestones del backlog..."
python3 scripts/crear_issues.py

echo ">> Abriendo el Pull Request pendiente (docs/guia-github -> develop)..."
gh pr create --base develop --head docs/guia-github \
  --title "docs(github): agregar guía para publicar el repositorio" \
  --body "Agrega la guía paso a paso para publicar y mantener el repositorio. Sin cambios de código."

echo ">> Listo. Para la defensa: une ese Pull Request desde GitHub (botón Merge) y muestra la pestaña Insights > Contributors."
