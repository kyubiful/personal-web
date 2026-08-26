---
title: 'Novedades de la versión 21.7 de NodeJS'
pubDate: 2024-03-14
description: 'Descubre cómo NodeJS transforma el desarrollo con sus últimas actualizaciones: gestión nativa de variables de entorno y coloración de consola sin dependencias externas. Estas innovaciones simplifican el flujo de trabajo y marcan el camino hacia un futuro más eficiente y minimalista en la programación.'
author: 'Sergio Zabala'
image:
  url: '/nodejs.webp'
  alt: 'Logotipo de NodeJS'
tags: ['NodeJS', 'JavaScript']
transitionSlug: 'node-v21-7-released'
---

## Adiós a la dependencia de dotenv

La primera actualización nos trae nativamente la gestión de variables de entorno sin necesidad de dependencias.

Ahora con la función `process.loadEnvFile()` podremos cargar variables de entorno directamente sin necesidad de especificar manualmente el archivo `.env` a cargar.

Si queremos cargar un archivo especifico podremos pasarle el path del archivo también `process.loadEnvFile('./.env.prod')`.

```env
API_KEY=ABXDEDFASDFSGSF
```

```js
// Esto cargaría por defecto el archivo .env
process.loadEnvFile()

// Esto cargaría un archivo específico
process.loadEnvFile('./.env.dev')
```

## No más dependencias para colorear la consola

La segunda nueva característica dentro de node es la posibilidad de agregar colores a tu consola nativamente. Antes se recurrian a biblotecas como `chalk`. Sin embargo desde esta versión de node podremos colorearlo sin necesidad de dependencias.

```js
const { styleText } = require('node:util')
const port = 3000

const message = styleText('red', `server started on port ${port}`)

console.log(message)
```

## Conclusión: Una evolución necesaria

Estas novedades simplifica el flujo de trabajo y elimina la necesidad de dependencias adicionales.

Aunque estas características están disponibles en la versión actual de Node es importante mencionar que no se consideran LTS aún, lo que significa que podrían no ser la opción más estable para entornos de producción. Sin embargo, con la próxima versión 22 en el horizonte, que se espera para abril, estas características estarán listas para ser adoptadas de manera más amplia.
