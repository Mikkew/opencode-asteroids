---
description: Crea un git worktree en .worktrees/ con un nombre derivado del argumento dado.
---

Vas a recibir un argumento en `$ARGUMENTS` que describe el contexto o propósito del worktree. Ese argumento puede o no contener espacios.

Tu única tarea es:

1. Analiza el argumento recibido en `$ARGUMENTS` y deriva un nombre de worktree conciso en **kebab-case en inglés**:
   - Minúsculas, palabras separadas por guiones (`-`).
   - Sin acentos ni caracteres especiales.
   - Traduce el contexto al inglés si viene en otro idioma.
   - Refleja el propósito del argumento (ej: `fix-login-bug`, `add-dark-mode`, `refactor-render-loop`).

2. Ejecuta **únicamente** este comando (reemplazando `<nombre-del-worktree>` por el nombre derivado):

```
git worktree add .worktrees/<nombre-del-worktree>
```

Reglas estrictas:
- No te cambies de directorio (no uses `cd` ni `workdir`).
- No hagas nada más: no crees commits, no hagas push, no edites archivos, no inicialices nada, no corras otros comandos.
- Solo ejecuta el comando `git worktree add` con el nombre derivado.

Argumento: $ARGUMENTS
