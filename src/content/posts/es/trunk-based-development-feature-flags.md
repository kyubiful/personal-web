---
title: 'Trunk-Based Development y Feature Flags: una alternativa práctica a Git-Flow'
pubDate: 2026-06-15
description: 'Git-flow promete orden a través de ramas de larga duración, pero en la práctica suele cambiar el dolor del merge por el dolor del release. Este artículo explica trunk-based development y los feature flags como una alternativa más ágil para entregar software de forma continua.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Diagrama de una única rama trunk con commits de corta duración integrándose directamente en main.'
tags: ['Software Development', 'Git', 'Best Practices']
transitionSlug: 'trunk-based-development-feature-flags'
---

## El problema de las ramas de larga duración

Git-flow fue diseñado para un mundo de releases planificados: ramas `develop`, `release/*`, `feature/*` y `hotfix/*` existen para aislar el trabajo hasta que está "listo". El problema es que ese aislamiento es justo lo que retrasa la integración. Una rama de feature que vive semanas acumula divergencia respecto a `main`, y el merge final termina siendo un evento de alto riesgo en lugar de algo rutinario.

La propia cultura de ingeniería de Google lo señala directamente. En _Software Engineering at Google_, los autores describen equipos que se vuelven "adictos a las ramas de desarrollo": notan que integrar ramas grandes desestabiliza el código y concluyen erróneamente que la solución es más aislamiento en ramas, no menos. El resultado es una sobrecarga creciente: coordinación dedicada de merges, roles rotativos de "Build Master" y burocracia de ramas de release que el libro califica sin rodeos como "sobrecarga pura".

## Qué es realmente trunk-based development

[Trunk-based development](https://trunkbaseddevelopment.com/) (TBD) es un modelo de control de versiones donde los desarrolladores integran continuamente su trabajo en una única rama —el trunk, normalmente `main`— en lugar de trabajar aislados durante largos períodos. Las prácticas centrales son sencillas:

- **Ramas de vida muy corta.** Cualquier rama de feature debería vivir como máximo uno o dos días antes de integrarse. Más allá de eso, empieza a comportarse como una rama de feature de git-flow.
- **Integración frecuente.** Los desarrolladores hacen commit al trunk al menos una vez al día, que es justamente lo que le da sentido a la integración continua (CI): no se puede integrar continuamente si nadie integra.
- **Un servidor de build que nunca duerme.** Cada commit al trunk dispara un build y una ejecución de tests. Si se rompe, arreglarlo es la prioridad número uno del equipo, no una tarea para "algún día".
- **Las ramas de release, si existen, son cortas y desechables.** Se crean justo a tiempo desde el trunk para un release y se eliminan después; no acumulan trabajo de features en curso.

Esto no es un truco de equipos pequeños. Google ejecuta trunk-based development con aproximadamente 35.000 ingenieros en un único monorepo, y solo un puñado de sus cerca de 1.000 equipos mantiene ramas de larga duración, típicamente por restricciones inusuales de compatibilidad hacia atrás.

## Por qué los feature flags lo hacen posible

La objeción obvia a TBD es: "¿Cómo integro una feature a medio terminar en `main` sin romper producción?". La respuesta son los feature flags (también llamados feature toggles).

La explicación clásica de Martin Fowler es que un [feature toggle](https://martinfowler.com/bliki/FeatureToggle.html) es un condicional que permite cambiar el comportamiento del sistema sin cambiar el código. En el contexto de trunk-based development, esto significa:

```js
if (featureFlags.newCheckoutFlow) {
  renderNewCheckout()
} else {
  renderLegacyCheckout()
}
```

El código de `newCheckoutFlow` puede integrarse en `main` en incrementos pequeños y revisables a lo largo de días o semanas. El flag permanece desactivado en producción hasta que la feature está realmente terminada, momento en el cual activarlo es un cambio de configuración, no un deploy. Como indica [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/feature-flags/), esto permite integrar código "antes de que esté listo para producción", que es precisamente lo que elimina la necesidad de una rama de feature de larga duración.

Fowler clasifica los toggles según su propósito, y vale la pena conocer la distinción porque afecta cuánto tiempo debería vivir un flag:

- **Release toggles**: ocultan trabajo en curso, pensados para ser de corta duración y eliminarse una vez lanzada la feature.
- **Experiment toggles**: impulsan tests A/B, viven solo mientras dura el experimento.
- **Ops toggles**: dan a los operadores un interruptor de emergencia en tiempo de ejecución, pueden vivir indefinidamente.
- **Permissioning toggles**: habilitan features según segmento de usuario (por ejemplo, usuarios beta, planes de pago), a menudo de larga duración por diseño.

Los release toggles —los que sustituyen a las ramas de feature de git-flow— son los que más necesitan un plan de limpieza.

## Guía práctica

**Mantén las ramas realmente cortas.** Si una rama sigue abierta después de dos días, es una señal para integrarla detrás de un flag o dividir el trabajo aún más. La rama sirve para revisión de código y CI, no para esconder funcionalidad incompleta.

**Protege el punto de entrada, no todo el código.** Fowler advierte contra dispersar condicionales `if` por toda la base de código: envuelve el nuevo comportamiento una sola vez, idealmente con un punto de extensión como la inyección de dependencias, en lugar de llenar cada capa de condicionales.

**Haz que CI pruebe los estados relevantes del flag.** Un pipeline que solo prueba con los flags desactivados no está probando lo que realmente se va a desplegar. La guía de trunk-based development recomienda ejecutar tests adicionales después de la etapa de tests unitarios para cada combinación relevante de flags, no para cada permutación combinatoria posible.

**Trata la limpieza de flags como parte de la definición de "terminado".** Esta es la disciplina que los equipos más suelen saltarse. La advertencia de Fowler es directa: si crear, mantener o eliminar flags requiere un esfuerzo significativo, tienes demasiados. La guía de trunkbaseddevelopment.com es concreta: documenta una fecha estimada de revisión para eliminar el flag en el momento en que se crea, y programa su eliminación (con aprobación de producto) aproximadamente un mes después del lanzamiento de la feature. Un flag que nadie recuerda es solo lógica condicional muerta esperando causar un bug.

**Reserva los toggles como último recurso, no como herramienta por defecto.** Fowler es explícito: antes de recurrir a un flag conviene probar releases más pequeños o un enfoque "keystone" (construir todo el backend primero y conectar la interfaz al final). Los feature flags resuelven un problema real, pero cada flag también es una pequeña porción de complejidad permanente hasta que se elimina.

## Conclusión: menos ramas, más disciplina

Trunk-based development no elimina la necesidad de disciplina: la traslada de sitio. Git-flow la impone a través de la estructura de ramas y la ceremonia de merge; TBD la impone a través de commits pequeños, un pipeline de CI que no se puede ignorar y feature flags que eventualmente hay que eliminar. Para equipos que despliegan de forma continua, ese cambio suele valer la pena: menos dolor de merge, feedback más rápido y una rama `main` que siempre está cerca de lo que realmente corre en producción.
