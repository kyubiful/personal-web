---
title: 'Git worktrees: el aislamiento real para agentes de IA en paralelo'
pubDate: 2026-09-02
description: 'Cómo usar git worktrees para que varios agentes de IA (Claude Code, OpenCode) escriban código al mismo tiempo sin pisarse entre sí. Comandos prácticos, el flujo de trabajo real y los gotchas que nadie te cuenta.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Varias copias de un mismo repositorio de código trabajando en paralelo, cada una en su propia rama.'
tags: ['AI', 'Developer Tools']
transitionSlug: 'git-worktrees-agentes-paralelos'
---

## Un repositorio, un solo HEAD

Un working tree normal tiene una limitación que rara vez piensas dos veces: solo puede tener una rama activa a la vez. Cambias de rama, tu `HEAD` apunta a otro commit, tu índice se actualiza, y los archivos en disco reflejan ese estado. Si intentas hacer dos cosas a la vez en el mismo directorio —dos ramas, dos cambios sin commitear, dos procesos escribiendo archivos— algo se pisa.

Eso siempre fue una limitación tolerable cuando el que trabajaba en el repo eras tú, una sola persona, una tarea a la vez. Deja de serlo en cuanto varios agentes de IA escriben código de forma concurrente sobre el mismo checkout.

## El problema concreto con agentes en paralelo

Si delegas dos tareas de escritura a dos subagentes distintos —por ejemplo, uno implementando un endpoint y otro escribiendo sus tests— y ambos trabajan sobre el mismo working tree, terminas con uno de estos escenarios:

- Un agente edita un archivo que el otro tenía abierto con cambios sin commitear, y esos cambios se pierden.
- Ambos intentan hacer `git stash` o `git checkout` al mismo tiempo, y el índice queda en un estado inconsistente.
- Uno instala dependencias o corre un build mientras el otro modifica `package.json`, y el resultado de ninguno de los dos es confiable.

No es un problema de que los agentes "se lleven mal": es que un solo working tree físicamente no puede representar dos estados a la vez. La solución no es coordinación más fina entre agentes, es darle a cada uno su propio directorio.

## Qué es un worktree, en la práctica

Un **git worktree** es un segundo (o tercer, o décimo) directorio de trabajo vinculado al mismo repositorio: comparten el mismo almacén de objetos (`.git`), pero cada worktree tiene su propio `HEAD`, su propio índice y sus propios archivos en disco. Es git nativo, no una herramienta externa ni un truco de symlinks.

```bash
# Crear un worktree nuevo con una rama nueva
git worktree add ../mi-repo-feature-x -b feature-x

# Listar los worktrees activos
git worktree list

# Quitar un worktree ya fusionado o descartado
git worktree remove ../mi-repo-feature-x

# Limpiar referencias a worktrees que borraste a mano
git worktree prune
```

`git worktree add` clona la estructura del repo en una nueva carpeta y la deja apuntando a la rama que le indiques (existente, o nueva con `-b`). A partir de ahí es un directorio de trabajo completo: puedes instalar dependencias, correr el proyecto, hacer commits, todo de forma completamente aislada del resto. El único requisito real es que una misma rama no puede estar *checked out* en dos worktrees al mismo tiempo; git te lo va a impedir explícitamente.

## Así lo usan Claude Code y OpenCode

Esto es exactamente lo que hay detrás de la opción de aislamiento por worktree en agentes como Claude Code u OpenCode cuando lanzas un subagente escritor: en lugar de que el subagente trabaje sobre tu checkout actual, la herramienta crea un worktree nuevo, lo checkea a una rama propia, y deja que el agente edite y commitee libremente ahí dentro. Si el agente rompe algo o toma un camino equivocado, tu working tree principal nunca se enteró: no hay nada que revertir porque nunca se tocó.

El flujo típico es:

1. Se crea un worktree por tarea o por agente (`git worktree add ../repo-nombre-tarea -b agente/nombre-tarea`).
2. El agente trabaja, commitea, corre sus propios tests dentro de ese worktree.
3. Al terminar, revisas el diff de esa rama como revisarías cualquier PR: la mergeas, la rebaseas, o la descartas directamente.
4. Una vez integrada o descartada, eliminas el worktree.

Varios agentes pueden correr en paralelo sin coordinación explícita entre sí porque, a nivel de sistema de archivos, están en directorios distintos. La única coordinación real ocurre al final, cuando decides qué ramas se integran al tronco.

## El gotcha: lo que vive fuera de git no sigue al worktree

Hay un detalle que sorprende la primera vez: cualquier herramienta que mantenga estado derivado del código —un índice de búsqueda, un cache de análisis estático, un grafo de símbolos para autocompletado— normalmente vive fuera del control de versiones, en una carpeta tipo `.herramienta/` que git ignora. Ese índice se construyó sobre los bytes de un checkout específico.

Cuando creas un worktree nuevo, el contenido en disco puede ser distinto (otra rama, otros archivos, otro estado), pero el índice de esa herramienta no viaja automáticamente con vos: sigue reflejando el checkout donde se generó. Si intentas reusar el mismo índice desde el worktree nuevo, vas a obtener resultados que no corresponden a lo que realmente hay en disco. La solución práctica es simple pero fácil de olvidar: cada worktree necesita su propio índice, generado contra su propio contenido. No es un bug de la herramienta, es una consecuencia directa de que el worktree es una copia de trabajo real y el índice no forma parte de git.

## Limpieza: cuándo tirar un worktree

Un worktree es seguro de eliminar una vez que su rama está mergeada (o explícitamente descartada) y no queda trabajo sin commitear que te importe. `git worktree remove` falla si detecta cambios sin guardar, como salvaguarda. Si borraste la carpeta a mano en lugar de usar `remove` —por ejemplo, con `rm -rf`—, git va a seguir listando esa referencia como si existiera hasta que corras `git worktree prune`, que limpia las referencias a directorios que ya no están en disco.

## Cuándo no necesitás worktrees

Si trabajas con un solo agente a la vez, de forma secuencial, una rama de feature normal alcanza y sobra: cambiar de rama en el mismo working tree no tiene ningún costo cuando no hay concurrencia real. Los worktrees valen la pena específicamente cuando hay **escritura simultánea real** —varios agentes, o vos y un agente al mismo tiempo— sobre el mismo repositorio. Fuera de ese caso, son una capa de complejidad (más directorios que mantener, más instalaciones de dependencias duplicadas) que no compra nada.

## Conclusión

Los worktrees no son una función nueva ni pensada originalmente para IA: existen en git desde hace años para casos como mantener un hotfix en una rama mientras seguís desarrollando en otra, sin hacer `stash` cada dos minutos. Lo que cambió es que ahora son la pieza de infraestructura obvia para un problema nuevo: darle a cada agente que escribe código en paralelo un espacio propio, real, a nivel de sistema de archivos, sin depender de que el propio agente sea perfectamente disciplinado. A medida que trabajar con varios agentes a la vez deja de ser la excepción, vale la pena tener el flujo de `git worktree add` / revisar / mergear / `remove` tan automatizado como el de crear una rama.
