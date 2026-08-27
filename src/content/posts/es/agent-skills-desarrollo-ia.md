---
title: 'Agent Skills: cómo empaquetar conocimiento reutilizable para tu asistente de IA'
pubDate: 2026-08-27
description: 'Las Agent Skills permiten empaquetar instrucciones, scripts y plantillas reutilizables en carpetas que un agente de IA carga bajo demanda. Descubre qué son, cuándo tiene sentido crear una y cómo estructurar un SKILL.md efectivo.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Carpetas de instrucciones cargándose dinámicamente en un agente de IA.'
tags: ['AI', 'Developer Tools']
transitionSlug: 'agent-skills-desarrollo-ia'
---

## El problema: repetir el mismo contexto una y otra vez

Si trabajas a diario con un asistente de IA en el código, seguro reconoces el patrón: explicas la misma convención de commits, el mismo checklist de revisión, o el mismo flujo para crear un ticket, una y otra vez en distintas conversaciones. Meterlo todo en un único archivo de instrucciones globales (`CLAUDE.md`, `AGENTS.md`, o equivalente) funciona hasta cierto punto, pero ese archivo crece sin control, consume contexto en cada turno aunque no sea relevante, y termina siendo difícil de mantener.

Las **Agent Skills** (o simplemente *skills*) resuelven este problema de forma distinta: en lugar de un único documento monolítico, empaquetas cada flujo de trabajo en su propia carpeta con instrucciones acotadas, que el agente descubre y carga **solo cuando la tarea lo amerita**.

## ¿Qué es exactamente una skill?

Una skill es una carpeta con una estructura mínima:

```
skills/{nombre-skill}/
├── SKILL.md              # Obligatorio: instrucciones principales
├── assets/                # Opcional: plantillas, esquemas, ejemplos
│   ├── template.py
│   └── schema.json
└── references/            # Opcional: documentación de apoyo
    └── docs.md
```

El archivo `SKILL.md` lleva un frontmatter YAML con metadatos clave:

```yaml
---
name: crear-ticket-jira
description: "Trigger: crear ticket, issue, tarea Jira. Crea tickets de Jira siguiendo el formato del equipo."
license: Apache-2.0
metadata:
  author: "tu-usuario"
  version: "1.0"
---
```

El campo `description` es el más importante de todo el archivo: es lo que el agente lee para decidir, sin cargar el resto del contenido, si esta skill es relevante para la tarea actual. Por eso debe incluir las palabras clave (*triggers*) que un usuario o un agente escribirían de forma natural al necesitar ese flujo.

## Por qué este diseño importa: carga bajo demanda

La diferencia clave frente a un archivo de instrucciones gigante es el **descubrimiento perezoso** (*lazy loading*). El agente mantiene en memoria solo el nombre y la descripción de cada skill disponible; el cuerpo completo de instrucciones se carga recién cuando detecta que la tarea calza con el *trigger*. Esto tiene dos beneficios directos:

- **El contexto no se satura** con instrucciones irrelevantes para la tarea del momento.
- **Las skills se pueden versionar y mantener por separado**, cada una acotada a un dominio concreto (crear un PR, generar un reporte, seguir una convención de testing), sin que un cambio en una afecte a las demás.

## Cuándo crear una skill (y cuándo no)

No todo merece convertirse en una skill. Antes de crear una, vale la pena preguntarse:

- ¿Este patrón se repite con frecuencia y el agente necesita guía específica para ejecutarlo bien?
- ¿Las convenciones de este proyecto difieren de lo que el agente asumiría por defecto?
- ¿El flujo tiene pasos concretos, decisiones condicionales o plantillas que conviene fijar por escrito?

Si la respuesta es no —el patrón es trivial, ocurre una sola vez, o ya está bien cubierto por documentación normal— probablemente no necesitas una skill nueva.

## Buenas prácticas al escribir el cuerpo

Una skill bien escrita no es un tutorial para humanos: es un **contrato de instrucciones para un modelo**. Algunas reglas que marcan la diferencia:

1. **Sé imperativo, no explicativo.** En vez de narrar cómo funciona algo, indica qué hacer paso a paso.
2. **Mantén el cuerpo corto.** Apunta a unos cientos de tokens; si necesitas explicar un concepto largo o un edge case, muévelo a `references/` y enlázalo.
3. **Usa tablas de decisión** cuando existan varios caminos posibles, en lugar de párrafos condicionales largos.
4. **Pon plantillas y esquemas en `assets/`**, no los pegues inline en `SKILL.md`.
5. **Evita una sección de "Keywords" separada.** Las palabras clave esenciales van dentro de `description`, no en un bloque aparte.

## Un ejemplo mínimo

```markdown
---
name: revisar-pr
description: "Trigger: revisar PR, code review, pull request. Aplica el checklist de revisión del equipo antes de aprobar un PR."
license: Apache-2.0
metadata:
  author: "sergio-zabala"
  version: "1.0"
---

## Reglas obligatorias

- Verifica que existan tests para cada cambio de lógica de negocio.
- Rechaza cualquier PR que incluya credenciales o secretos en texto plano.
- Confirma que el título del PR siga Conventional Commits.

## Salida esperada

Devuelve una lista de hallazgos ordenados por severidad, o "Sin hallazgos" si el PR cumple el checklist.
```

Con esto, cualquier agente que detecte una tarea de revisión de código cargará estas reglas automáticamente, sin que tengas que repetirlas en el prompt.

## Conclusión

Las Agent Skills son, en el fondo, una forma de aplicar un principio muy conocido en ingeniería de software —separación de responsabilidades y carga perezosa— al contexto de un agente de IA. En lugar de un único archivo de instrucciones que crece sin límite, terminas con un catálogo de capacidades modulares, versionables y fáciles de mantener, donde cada una se activa solo cuando realmente aporta valor. Si tu equipo repite los mismos flujos con un asistente de IA semana tras semana, empaquetarlos como skills es de las inversiones con mejor retorno que puedes hacer en tu configuración de herramientas.
