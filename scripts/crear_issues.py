#!/usr/bin/env python3
"""Crea en GitHub las issues, etiquetas y milestones del backlog de LobbyMaster.

Requisitos: tener instalado GitHub CLI (gh) y haber iniciado sesión (gh auth login).
Uso (desde la carpeta del repositorio, con el remoto 'origin' ya creado):
    python3 scripts/crear_issues.py
Autor: Yair Anibal Mamani Ticona
"""
import csv
import json
import subprocess
import sys
from pathlib import Path

CSV = Path(__file__).resolve().parent.parent / "docs" / "LobbyMaster_Jira_Import.csv"
ETIQUETAS = {
    "historia": ("1f6feb", "Historia de usuario"),
    "tarea": ("6e7781", "Tarea técnica"),
    "must": ("d73a4a", "Prioridad MoSCoW: imprescindible"),
    "should": ("fbca04", "Prioridad MoSCoW: importante"),
    "could": ("0e8a16", "Prioridad MoSCoW: deseable"),
}


def gh(*args, check=True):
    r = subprocess.run(["gh", *args], capture_output=True, text=True)
    if check and r.returncode != 0:
        sys.exit("Error en gh " + " ".join(args) + ":\n" + r.stderr)
    return r.stdout.strip()


def main():
    repo = json.loads(gh("repo", "view", "--json", "nameWithOwner"))["nameWithOwner"]
    print("Repositorio:", repo)
    for nombre, (color, desc) in ETIQUETAS.items():
        gh("label", "create", nombre, "--color", color, "--description", desc, "--force")
    with open(CSV, encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    for sprint in sorted({r["Sprint"] for r in filas}):
        gh("api", f"repos/{repo}/milestones", "-f", f"title={sprint}", check=False)
    for r in filas:
        titulo = r["Summary"]
        es_hu = titulo.startswith("HU-")
        etiquetas = ["historia" if es_hu else "tarea", r["Labels"].split(",")[0].strip() or "should"]
        cuerpo = (
            f"{r['Description']}\n\n"
            f"- **Puntos de historia:** {r['Story point estimate']}\n"
            f"- **Prioridad:** {r['Priority']}\n"
            f"- **Sprint:** {r['Sprint']}\n"
            f"- **Estado en el tablero:** {r['Status']}\n"
        )
        url = gh("issue", "create", "--title", titulo, "--body", cuerpo,
                 "--label", ",".join(etiquetas), "--milestone", r["Sprint"], "--assignee", "@me")
        print("Creada:", url)
        if r["Status"].strip().lower() == "done":
            gh("issue", "close", url, "--comment", "Historia terminada y mostrada en la demo del sprint.")
    print("Listo. Revisa la pestaña Issues y Milestones en GitHub.")


if __name__ == "__main__":
    main()
