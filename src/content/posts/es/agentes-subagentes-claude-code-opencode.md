---
title: 'Agentes y subagentes: orquestando IA en el desarrollo con Claude Code y OpenCode'
pubDate: 2026-08-28
description: 'Cómo Claude Code y OpenCode delegan tareas acotadas a subagentes especializados para mantener el contexto limpio, paralelizar trabajo y aislar cambios. Qué son, cuándo delegar y cómo definir tu propio subagente.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Un agente orquestador delegando tareas a varios subagentes especializados.'
tags: ['AI', 'Developer Tools']
transitionSlug: 'agentes-subagentes-claude-code-opencode'
---

## El límite de una sola conversación

Cuando usas un asistente de IA agéntico en la terminal para trabajar en un repositorio real, tarde o temprano chocas con el mismo problema: una sola conversación acumula demasiado contexto. Exploras cuatro archivos para entender una función, lees el resultado completo de un build, revisas un diff enorme... y todo eso queda flotando en la misma ventana de contexto, aunque solo necesitabas una conclusión de tres líneas.

Tanto **Claude Code** como **OpenCode** resuelven esto con el mismo concepto de fondo: en lugar de que un único agente cargue con todo, un **agente orquestador** delega tareas acotadas a **subagentes** que corren en su propio contexto aislado y devuelven solo el resultado final. El ruido de exploración —los archivos leídos, los comandos ejecutados, los intentos fallidos— se queda del lado del subagente; el hilo principal solo recibe la síntesis.

## Qué es un subagente, en concreto

Un subagente es, en esencia, un agente completo (con su propio prompt de sistema, sus propias herramientas y a veces su propio modelo) que se invoca para una tarea puntual y bien delimitada:

- Explorar un código base para responder "¿dónde está definida esta función y quién la llama?"
- Escribir dos o más archivos no triviales que ya están claros en diseño.
- Ejecutar una revisión de código adversarial con reglas propias.
- Correr un test suite o un build y reportar solo el resultado.

Lo importante es que el agente que lo invoca **no necesita ver el proceso**, solo el resultado. Esto reduce drásticamente el contexto que el hilo principal tiene que arrastrar durante toda la sesión.

## Claude Code: el `Task`/`Agent` tool y los agentes personalizados

En Claude Code, el orquestador dispone de una herramienta de agente que lanza subagentes con un `subagent_type`. Hay tipos predefinidos —por ejemplo uno de exploración de solo lectura para búsquedas rápidas de código, o uno de planificación para diseñar una estrategia de implementación— y también puedes definir los tuyos propios como archivos Markdown en `.claude/agents/`:

```markdown
---
name: revisor-seguridad
description: Revisa cambios de código buscando vulnerabilidades de seguridad antes de un merge.
tools: Read, Grep, Glob
model: sonnet
---

Eres un revisor de seguridad. Analiza el diff en busca de inyección de comandos,
XSS, SQL injection y otros riesgos del OWASP Top 10. Reporta solo hallazgos
verificados, ordenados por severidad.
```

El frontmatter define el nombre, cuándo se activa (`description`), qué herramientas tiene disponibles y qué modelo usa. Un subagente con `tools: Read, Grep, Glob` no puede escribir archivos ni ejecutar comandos, así que sirve como revisor de solo lectura por diseño, no por convención.

Claude Code también soporta **forks**: un subagente que hereda todo el contexto de la conversación actual (a diferencia de un agente fresco, que arranca sin memoria) y corre en segundo plano mientras tú sigues conversando. Es útil para preguntas exploratorias abiertas donde no vale la pena traer de vuelta el ruido de la búsqueda, pero sí el contexto ya construido.

## OpenCode: el mismo patrón, otra sintaxis

OpenCode implementa una idea equivalente. Los agentes se definen como archivos Markdown en `.opencode/agent/`, con un frontmatter que incluye `description`, `mode` y las herramientas permitidas:

```markdown
---
description: Ejecuta el test suite y reporta solo fallos
mode: subagent
tools:
  write: false
  edit: false
---

Ejecuta la suite de tests del proyecto. Si falla algo, reporta el archivo,
la línea y el mensaje de error exacto. Si todo pasa, responde solo "OK".
```

El campo `mode` puede ser `primary` (el agente conversacional principal), `subagent` (solo invocable por delegación) o `all` (ambos). Un subagente se puede invocar automáticamente cuando su `description` calza con la tarea, o manualmente mencionándolo con `@nombre-del-agente` en el mensaje.

La diferencia de sintaxis entre ambas herramientas es superficial; el diseño subyacente es el mismo: **aislar el contexto de ejecución, acotar las herramientas disponibles a lo que la tarea necesita, y devolver solo la síntesis al agente que delegó**.

## Cuándo delegar y cuándo no

Delegar no es gratis: lanzar un subagente tiene un costo de arranque (no comparte el caché de la conversación de la misma manera que seguir en el mismo hilo) y agrega una vuelta de ida y vuelta. La pregunta útil antes de delegar es: **¿esta lectura o esta escritura infla el contexto del hilo principal sin necesidad?**

Reglas prácticas que suelen funcionar bien:

- Leer 1-3 archivos para decidir o verificar algo puntual: hazlo inline.
- Explorar 4 o más archivos para entender algo: delega una exploración acotada.
- Escribir un único archivo mecánico y ya entendido: inline.
- Escribir dos o más archivos no triviales, o preparar una escritura con investigación previa: delega un escritor.
- Tests, builds, instalaciones, revisiones de código: siempre valen un subagente fresco, incluso para acciones puntuales dentro de un flujo que de otro modo es inline.

## Aislamiento real: worktrees para escritores en paralelo

Cuando varios subagentes necesitan escribir código al mismo tiempo, delegar solo no alcanza si comparten el mismo working tree: se van a pisar los cambios. Tanto Claude Code como OpenCode soportan lanzar un subagente dentro de un **git worktree** propio, de forma que cada escritor trabaja sobre su propia copia aislada del repositorio y el resultado se integra (o se descarta) explícitamente al terminar. Esto evita el caso clásico de dos agentes editando el mismo archivo a la vez y corrompiendo el estado del repo.

## Conclusión

El patrón de orquestador más subagentes especializados no es una idea nueva en ingeniería de software: es el mismo principio detrás de microservicios, de separar un monolito en responsabilidades acotadas, o de un tech lead delegando tareas concretas a su equipo en lugar de hacer todo él mismo. Lo que cambia es que ahora ese patrón se aplica a cómo interactúas con tu asistente de IA: mantener el hilo principal liviano y dejar que el trabajo pesado, ruidoso o paralelizable ocurra en agentes aislados que solo reportan lo que importa. Si notas que tus conversaciones con Claude Code u OpenCode se vuelven lentas o pierden foco a medida que crecen, la solución rara vez es "explicar mejor": casi siempre es delegar mejor.
