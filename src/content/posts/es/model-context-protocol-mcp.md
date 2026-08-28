---
title: 'Model Context Protocol (MCP): conectando LLMs con herramientas externas'
pubDate: 2026-08-12
description: 'Una introducción práctica al Model Context Protocol (MCP), el estándar abierto para conectar asistentes de IA con fuentes de datos y herramientas externas: su arquitectura cliente-servidor, el problema de integración que resuelve y cómo un servidor expone tools, resources y prompts.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Diagrama de una aplicación de IA conectándose a herramientas externas mediante el Model Context Protocol.'
tags: ['AI', 'LLM', 'MCP']
transitionSlug: 'model-context-protocol-mcp'
---

## ¿Qué es MCP?

Model Context Protocol (MCP) es un estándar abierto para conectar aplicaciones de IA con sistemas externos: archivos locales, bases de datos, APIs y otras herramientas. Anthropic lo liberó como open source en noviembre de 2024, y desde entonces ha crecido hasta convertirse en un esfuerzo de ecosistema más amplio, actualmente alojado por la Linux Foundation y con soporte de las principales aplicaciones de IA (Claude, ChatGPT) y editores de código (VS Code, Cursor).

La documentación oficial lo describe con una analogía sencilla: MCP es como un puerto USB-C para aplicaciones de IA. En lugar de que cada asistente necesite una integración a medida para cada herramienta o fuente de datos, MCP ofrece un conector común sobre el que construir en ambos lados.

## El problema que resuelve: integraciones M×N

Antes de MCP, cada aplicación de IA que quería hablar con un sistema externo (una base de datos, una herramienta de tickets, un calendario) necesitaba su propia integración a medida para ese sistema. Con **M** aplicaciones de IA y **N** herramientas externas, terminas construyendo y manteniendo aproximadamente **M×N** integraciones, una por cada par.

MCP convierte eso en un problema **M+N**: quien crea una herramienta construye un único servidor MCP, y cualquier aplicación compatible con MCP puede hablar con él sin código adicional. Quien crea la aplicación implementa un único cliente MCP y obtiene acceso inmediato a todos los servidores del ecosistema.

## Arquitectura cliente-servidor: hosts, clients y servers

MCP define tres participantes:

- **Host**: la aplicación de IA que coordina todo, como Claude Desktop, Claude Code o VS Code con Copilot.
- **Client**: un componente que el host crea por cada conexión. Cada cliente mantiene una única conexión dedicada a un servidor.
- **Server**: un programa que expone contexto (datos y acciones) a los clientes a través del protocolo.

Un host puede mantener varios clientes a la vez, uno por cada servidor conectado. Si VS Code se conecta a un servidor de sistema de archivos y a un servidor de Sentry, internamente crea dos clientes MCP independientes, cada uno vinculado a su propio servidor.

Los servidores pueden ejecutarse en local o en remoto, y esto se corresponde con los dos transportes que soporta MCP:

- **stdio**: el cliente lanza el servidor como un subproceso local y se comunican por entrada/salida estándar. No hay red de por medio; normalmente hay un cliente por servidor.
- **Streamable HTTP**: el cliente habla con un servidor remoto por HTTP (con Server-Sent Events opcionales para streaming), normalmente autenticado con OAuth o un bearer token. Un servidor remoto puede atender a muchos clientes a la vez.

Debajo de ambos transportes, MCP intercambia mensajes JSON-RPC 2.0; el transporte solo decide cómo viajan esos mensajes.

## Qué expone un servidor: tools, resources y prompts

Un servidor MCP puede ofrecer tres tipos de primitivas, cada una con un "quién decide" distinto:

| Primitiva     | Qué es                                                                                                                                                        | Quién la controla |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **Tools**     | Funciones ejecutables con un JSON Schema para sus entradas, por ejemplo `searchFlights` o `sendEmail`. El modelo decide cuándo llamarlas.                     | El modelo         |
| **Resources** | Datos de solo lectura identificados por una URI, como `file:///informe.pdf` o `calendar://events/2026`. La aplicación decide cómo obtenerlos y usarlos.       | La aplicación     |
| **Prompts**   | Plantillas reutilizables y parametrizadas (por ejemplo, "planificar unas vacaciones") que combinan tools y resources concretos en un flujo de trabajo guiado. | El usuario        |

Un cliente descubre lo que ofrece un servidor mediante métodos de listado (`tools/list`, `resources/list`, `prompts/list`) antes de llamar a nada, así que la superficie disponible puede cambiar en tiempo de ejecución y el servidor puede notificar al cliente cuando eso ocurre.

## Un ejemplo práctico sencillo

Este es un servidor MCP mínimo construido con el SDK de Python, que expone una sola tool. El SDK convierte automáticamente una función con type hints y docstring en una definición de tool:

```python
from mcp.server import MCPServer

mcp = MCPServer("weather")

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Obtiene el pronóstico del tiempo para una ubicación.

    Args:
        latitude: Latitud de la ubicación
        longitude: Longitud de la ubicación
    """
    # obtener y formatear los datos del pronóstico...
    return "Soleado, 22°C"
```

Desde fuera, este servidor anuncia una tool llamada `get_forecast` con un `inputSchema` que exige `latitude` y `longitude`. Un host como Claude Desktop se conecta, lista sus tools y, cuando el usuario pregunta "¿qué tiempo hace en Barcelona?", el modelo decide llamar a `get_forecast`, el cliente envía `tools/call`, el servidor ejecuta la función y el resultado vuelve a la conversación como contexto.

Nada de esto es específico de Claude: cualquier host compatible con MCP puede hablar con este mismo servidor sin tocar su código.

## Conclusión

MCP no hace más inteligentes a los modelos: estandariza la fontanería entre los modelos y los sistemas sobre los que necesitan actuar. Al separar "cómo hablo con una fuente de datos o una herramienta" de "qué aplicación de IA estoy usando", convierte un problema de integración combinatorio en uno lineal. Si estás construyendo una funcionalidad de IA que necesita salir del modelo (archivos, APIs, herramientas internas), recurrir a un servidor MCP existente, o escribir uno pequeño como el del ejemplo, suele costar menos que inventar otra integración a medida.
