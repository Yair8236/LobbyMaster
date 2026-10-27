#!/usr/bin/env bash
# Muestra evidencia del repositorio: ramas, commits, convención, versiones y participación.
# Autor: Yair Anibal Mamani Ticona
set -e
cd "$(dirname "$0")/.."

echo "=== RAMAS ==="
git branch -a --format='%(refname:short)'
echo
echo "=== VERSIONES (etiquetas) ==="
git tag -n1
echo
echo "=== HISTORIAL (grafo) ==="
git log --graph --oneline --decorate --all
echo
echo "=== COMMITS POR TIPO (convención) ==="
git log --all --no-merges --pretty='%s' | sed -E 's/^([a-z]+).*/\1/' | sort | uniq -c | sort -rn
echo
echo "=== PARTICIPACIÓN INDIVIDUAL ==="
git shortlog -sne --all --no-merges
