---
title: 'RAG (Generación Aumentada por Recuperación): patrones y errores habituales'
pubDate: 2026-08-18
description: 'Una guía práctica sobre RAG: por qué existe, cómo funciona el pipeline de chunking, embeddings, búsqueda vectorial, re-ranking y ensamblado de prompts, y los errores que los equipos cometen en producción.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Diagrama que representa un pipeline de generación aumentada por recuperación.'
tags: ["AI", "LLM", "RAG"]
transitionSlug: 'rag-retrieval-augmented-generation'
---

## Por qué existe RAG

Los modelos de lenguaje grandes quedan "congelados" en el momento del entrenamiento y almacenan su conocimiento dentro de miles de millones de parámetros. Esto genera dos problemas prácticos: el modelo no sabe nada de lo ocurrido después de ese entrenamiento, y no puede acceder a tus datos privados (documentación interna, tickets, código) porque nunca formaron parte del dataset original. Hacer fine-tuning sobre datos privados es costoso, hay que repetirlo cada vez que los datos cambian, y en la práctica no enseña hechos nuevos de forma fiable, sino más bien patrones de estilo.

Retrieval-Augmented Generation, presentado por Lewis et al. (Facebook AI Research, 2020) en ["Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"](https://arxiv.org/abs/2005.11401), propone una arquitectura distinta: combinar un modelo paramétrico (el LLM) con una memoria no paramétrica (un recuperador sobre un corpus externo, originalmente un índice vectorial denso sobre Wikipedia). En lugar de pedirle al modelo que recuerde hechos desde sus pesos, se recuperan los pasajes relevantes en el momento de la consulta y se incluyen en la ventana de contexto. El paper original reportó que esta combinación superaba tanto a los modelos puramente paramétricos como a sistemas específicos de recuperación y extracción en benchmarks de preguntas y respuestas de dominio abierto, y generaba texto más específico y factual que la generación basada únicamente en parámetros.

El beneficio práctico para quien construye aplicaciones: puedes fundamentar las respuestas en un conjunto de documentos que cambia a diario, citar fuentes, y actualizar el conocimiento reindexando en vez de reentrenando.

## El pipeline básico

Un sistema RAG típico en producción tiene cinco etapas:

1. **Chunking** — dividir los documentos fuente en fragmentos más pequeños, porque no conviene (ni es posible) convertir un documento entero en un solo vector.
2. **Embeddings** — convertir cada fragmento en un vector denso mediante un modelo de embeddings.
3. **Búsqueda vectorial** — en el momento de la consulta, se genera el embedding de la pregunta del usuario y se recuperan los fragmentos más cercanos de un índice vectorial (o se combina con búsqueda por palabras clave tipo BM25).
4. **Re-ranking** — los candidatos recuperados, junto con la consulta original, pasan por un modelo más costoso pero más preciso que los reordena según relevancia real.
5. **Ensamblado del prompt** — los fragmentos mejor rankeados se insertan en la ventana de contexto del LLM junto con la pregunta del usuario, y se genera la respuesta final.

```
consulta ──► embedding ──► búsqueda vectorial (top-k) ──► re-ranking (top-n) ──► ensamblado de prompt ──► respuesta del LLM
                                  ▲
                     documentos fragmentados
                       y con embeddings
```

Cada etapa es un punto donde se puede ganar o perder calidad, y es justo ahí donde la mayoría de los equipos se tropieza.

## Error habitual #1: mala estrategia de chunking

El chunking parece trivial y casi nunca lo es. La [guía de estrategias de chunking de Pinecone](https://www.pinecone.io/learn/chunking-strategies/) recomienda empezar con fragmentos de tamaño fijo como línea base, pero señala la tensión real: los fragmentos deben ser "suficientemente grandes para contener información significativa, pero suficientemente pequeños para permitir aplicaciones de bajo tiempo de respuesta". Si se fragmenta demasiado pequeño, el chunk pierde el contexto que le da sentido; si se fragmenta demasiado grande, se diluye el dato concreto que la consulta busca, y eso perjudica la precisión del embedding. La guía sugiere probar distintos tamaños (habitualmente entre 128 y 1024 tokens) contra consultas reales, en lugar de fijar un número y seguir adelante sin validarlo.

Hay una variante más sutil de este problema: incluso fragmentos bien dimensionados pueden resultar *ambiguos* fuera de contexto. El artículo de Anthropic sobre [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) da el ejemplo clásico: un fragmento que dice "los ingresos crecieron un 3%" es inútil si no se sabe de qué empresa o de qué trimestre se habla. Su solución consiste en anteponer a cada fragmento un breve resumen de contexto generado por un LLM antes de indexarlo (tanto para el embedding vectorial como para BM25). En sus evaluaciones, los embeddings contextuales por sí solos redujeron la tasa de fallos de recuperación en un 35%, y la combinación de embeddings contextuales con BM25 contextual la redujo en un 49% (de 5.7% a 2.9% de fallos en el top-20).

## Error habitual #2: saltarse el re-ranking

Muchos equipos lanzan un sistema RAG que va directo de la búsqueda vectorial al prompt. El problema, como explica la [guía de rerankers de Pinecone](https://www.pinecone.io/learn/series/rag/rerankers/), es que los embeddings vectoriales son una compresión con pérdida: un bi-encoder tiene que comprimir todos los significados posibles de un fragmento en un único vector, sin conocer de antemano la consulta real. Eso produce un conjunto de candidatos *semánticamente* parecidos, pero no necesariamente los *más relevantes* para lo que el usuario preguntó.

Un reranker (típicamente un cross-encoder) corrige esto con una segunda pasada, más costosa: analiza la consulta original y cada documento candidato en conjunto, en lugar de comparar vectores precalculados, y reordena los mejores candidatos según relevancia real. Ejecutar un cross-encoder sobre todo un corpus sería demasiado lento —la guía cita más de 50 horas para puntuar 40 millones de registros que la búsqueda vectorial resuelve en menos de 100ms—, así que el patrón estándar es de dos etapas: la búsqueda vectorial, barata, reduce millones de documentos a unas pocas decenas, y el reranker vuelve a puntuar solo esa lista corta. Las cifras de Anthropic hacen tangible la ganancia: añadir re-ranking sobre la recuperación contextual llevó su reducción de fallos del 49% al 67% (hasta 1.9%).

## Error habitual #3: índices desactualizados

Un sistema RAG vale lo que vale su índice. Si los documentos subyacentes cambian —se actualiza una política, se resuelve un ticket, se refactoriza código— y el almacén vectorial no se vuelve a generar y reindexar, el modelo recuperará y citará con total confianza información obsoleta. Es fácil pasarlo por alto porque nada "falla" de forma visible: el pipeline sigue funcionando, sigue devolviendo fragmentos, sigue generando una respuesta que suena plausible. La frescura del índice debe tratarse como una preocupación operativa de primer nivel (reindexado incremental ante cambios en los documentos, TTLs, o reconstrucciones completas programadas), no como un añadido de última hora tras el primer lanzamiento.

## Error habitual #4: confundir relevancia de recuperación con calidad de respuesta

Es tentador tratar "¿recuperamos los fragmentos correctos?" y "¿la respuesta final fue buena?" como la misma pregunta, pero son fallos distintos que requieren evaluaciones separadas. Un sistema puede recuperar pasajes perfectamente relevantes y aun así generar una respuesta incorrecta o alucinada, si el modelo interpreta mal o ignora el contexto, o si el prompt entierra el fragmento clave bajo demasiado material irrelevante. A la inversa, un sistema puede recuperar fragmentos mediocres y aun así producir una respuesta que suena convincente pero no está realmente fundamentada, lo cual es peor, porque *parece* confiable. Conviene evaluar por separado la calidad de la recuperación (precisión y recall de los fragmentos relevantes) y la calidad de la respuesta de punta a punta (fidelidad al contexto recuperado, corrección), en lugar de mezclarlo todo en un juicio de "parece que funcionó".

## Conclusión

RAG existe para resolver una limitación real: los LLM no pueden saberlo todo, y reentrenarlos cada vez que cambian tus datos no es viable. El pipeline —fragmentar, generar embeddings, buscar, re-rankear, ensamblar— es conceptualmente simple, pero cada paso tiene formas de fallar que solo aparecen con uso real: fragmentos que pierden contexto, conjuntos de recuperación parecidos pero no relevantes, índices que quedan obsoletos sin que nadie lo note, y respuestas que parecen fundamentadas sin estarlo. Ninguno de estos es un problema exótico; son el costo ordinario de poner en producción un sistema de recuperación, y las soluciones (chunking contextual, re-ranking en dos etapas, pipelines de frescura, evaluación separada de recuperación y generación) ya están bien documentadas por los equipos que se toparon con ellos primero.
