---
title: 'Qwen3.8-27B: un modelo de visión y lenguaje denso para agentes de código en local'
pubDate: 2026-08-26
description: 'Alibaba publicó Qwen3.8-27B bajo licencia Apache 2.0 el 14 de agosto de 2026: un modelo de visión y lenguaje denso de 27B de parámetros, con una ventana de contexto nativa de 262k tokens, pensado para codificación agéntica y tareas de computer-use, y lo bastante pequeño como para correr cuantizado en una sola GPU de 24GB.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Ilustración que representa un modelo de visión y lenguaje local para codificación agéntica.'
tags: ['AI', 'LLM', 'Open Source']
transitionSlug: 'qwen3-8-27b-local-agentic-coding'
---

## Qué se publicó

El 14 de agosto de 2026, el equipo de Qwen de Alibaba publicó Qwen3.8-27B bajo licencia Apache 2.0: pesos completos, sin lista de espera. Según la [ficha oficial del modelo](https://huggingface.co/Qwen/Qwen3.8-27B), el checkpoint exacto tiene 27.78 mil millones de parámetros en configuración **densa** (sin enrutamiento tipo mixture-of-experts), es nativamente multimodal (entiende texto, imágenes y video), y se distribuye como unos 55.6 GB de safetensors en BF16 repartidos en 18 fragmentos. La arquitectura apila 64 capas de transformer con un esquema de atención híbrido —16 capas de Gated DeltaNet alternadas con Gated Attention— en lugar de una pila uniforme de bloques de atención estándar.

El dato que más importa para quien trabaja con bases de código grandes o trazas largas de agentes: una ventana de contexto nativa de 262,144 tokens, extensible hasta 1,000,000 de tokens mediante escalado de rope con YaRN.

## Denso, y a propósito

La mayoría de los lanzamientos abiertos recientes en este rango de tamaño se apoyan en enrutamiento mixture-of-experts (MoE) para reducir el costo de inferencia. Qwen3.8-27B va en la dirección contraria: todos los parámetros están activos en cada pasada. Esa decisión cuesta algo de throughput comparado con un modelo disperso de tamaño total similar, pero a cambio ofrece algo que los modelos MoE no dan con la misma limpieza: una única matriz de pesos uniforme que se cuantiza de forma predecible y se comporta igual con cualquier prompt, justo lo que se necesita cuando el objetivo de despliegue es una sola GPU de estación de trabajo y no un clúster de inferencia multi-nodo.

## Pensado para codificación agéntica, no solo para chat

La ficha del modelo destaca cifras de benchmarks orientadas directamente a tareas de codificación y computer-use: SWE-bench Pro (61.7), Terminal-Bench 2.1 (73.0), OSWorld (84.3), WebArena (64.8), AndroidWorld (81.9), GPQA Diamond (89.2) y LiveCodeBench (90.3). La cobertura temprana del lanzamiento ([orcarouter.ai](https://www.orcarouter.ai/blog/qwen-3-8-27b-release-date), [Local AI Zone](https://local-ai-zone.github.io/blog/qwen3-8-27b-comprehensive-analysis.html)) lo describe como un salto considerable respecto al checkpoint anterior, Qwen3.6-27B, con el mismo tamaño de decoder: Terminal-Bench 2.1 pasa de 63.4 a 73.0, DeepSWE 1.1 de 13.3 a 42.2, OSWorld-Verified de 63.9 a 84.3, y SWE-MM de 25.7 a 38.6. Qwen enmarca el lanzamiento en torno a "tareas agénticas de largo horizonte": sesiones de codificación de varios pasos, bucles de retroalimentación con el entorno, y agentes de computer-use que tienen que planificar, actuar, observar y corregir a lo largo de muchos turnos, no responder a un único prompt.

## Hardware: lo que realmente hace falta para correrlo en local

Los requisitos de memoria escalan fuerte con la precisión, y la ventana de contexto de 262k hace que el overhead de la caché KV sea un factor real por encima de los pesos base:

- **BF16** (precisión completa): ~56 GB — en la práctica, una tarjeta de clase 80GB (H100, H200)
- **FP8**: ~28 GB — una tarjeta de clase 48GB (L40S, RTX Pro 6000)
- **4-bit** (GGUF/AWQ): ~14–16 GB — cabe en una sola tarjeta de consumo de 24GB (RTX 4090)

Esa última cifra —la afirmación de que "cabe en una GPU de 24GB"— proviene del [artículo de hardware de Yotta Labs](https://www.yottalabs.ai/post/qwen-3-8-27b-specs-hardware-requirements-how-to-run-2026), una pieza de vendor/blog y no un benchmark reproducido de forma independiente, y excluye explícitamente la caché KV, que crece con la longitud de contexto y las solicitudes concurrentes. Tómala como una estimación razonable, no como una garantía para tu longitud de contexto exacta.

Como dato independiente y de primera mano, [Simon Willison probó un build GGUF Q4_K_M](https://simonwillison.net/2026/Aug/16/qwen-38-27b/) (unos 17 GB) en una MacBook Pro M5 Max con 128GB y en una NVIDIA DGX Spark, obteniendo entre 15 y 30 tokens por segundo, notablemente más lento que las APIs alojadas sirviendo el mismo modelo a 74–184 tokens por segundo. También señala que Qwen3.8-27B usa por defecto un nivel de razonamiento muy alto ("xhigh") y tiende a sobrepensar prompts triviales; su recomendación es arrancar con razonamiento bajo o nulo, "sobre todo en hardware de consumo".

## Cómo ejecutarlo

Con vLLM, para quien tenga VRAM suficiente para servirlo directamente:

```bash
vllm serve Qwen/Qwen3.8-27B --max-model-len 262144
```

Con un build GGUF cuantizado (llama.cpp / LM Studio), para una sola tarjeta de 24GB:

```bash
huggingface-cli download ggml-org/Qwen3.8-27B-GGUF --local-dir ./qwen3.8-27b-gguf

llama-cli -m ./qwen3.8-27b-gguf/qwen3.8-27b-Q4_K_M.gguf \
  --ctx-size 32768 \
  --reasoning-effort low
```

Con MLX en Apple Silicon, usando el build de 4-bit publicado por la comunidad:

```bash
pip install mlx-lm

mlx_lm.generate --model mlx-community/Qwen3.8-27B-4bit \
  --prompt "Refactoriza esta función y explica el cambio."
```

O directamente con Transformers, si solo lo necesitas dentro de un pipeline de Python:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen3.8-27B", device_map="auto")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen3.8-27B")
```

## Cómo se posiciona frente a otros modelos

Dentro de la categoría de "unos 30B, denso, corre en local" —junto a modelos como Mistral Small, Gemma y otros pesos abiertos de ese rango— la propuesta de Qwen3.8-27B es la combinación de buenas cifras en benchmarks de codificación agéntica, una ventana de contexto nativa realmente larga, y soporte nativo de visión y lenguaje en un único checkpoint denso, más que destacar en un solo número aislado. Parte de la cobertura temprana ha ido más allá y lo ha [calificado como "el lanzamiento de IA local más importante de 2026"](https://medium.com/@rosgluk/qwen-3-8-27b-is-coming-and-it-could-be-the-most-important-local-ai-release-of-2026-c1cf381d5292); es el encuadre de un autor de blog, no una afirmación verificada de forma independiente, y conviene tratarla como tal. La lectura independiente más mesurada es la de Willison: una capacidad genuinamente impresionante empaquetada en un checkpoint descargable, pero con un throughput real en hardware de consumo que todavía va bastante por detrás de las APIs alojadas.

## Conclusión

Qwen3.8-27B no es el modelo más grande publicado este año, ni pretende serlo. Su propuesta es más concreta y útil para quien trabaja desde una sola estación de trabajo: un modelo denso, con licencia Apache 2.0, capaz de visión, con contexto nativo de 262k tokens y cifras de benchmark orientadas específicamente a agentes de codificación y tareas de computer-use, lo bastante pequeño como para que una GPU de 24GB lo corra cuantizado. Que termine siendo el modelo local de codificación por defecto dependerá menos de las cifras del día del lanzamiento y más de cómo se comporte cuando más gente lo someta a cargas de trabajo agénticas reales, pero la descarga es gratuita, tiene licencia Apache y ya está disponible en Hugging Face para quien quiera comprobarlo por sí mismo.
