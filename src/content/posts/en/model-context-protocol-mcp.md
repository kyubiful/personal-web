---
title: 'Model Context Protocol (MCP): Connecting LLMs to External Tools'
pubDate: 2026-08-12
description: 'A practical introduction to the Model Context Protocol (MCP), the open standard for connecting AI assistants to external data sources and tools: the client-server architecture, the integration problem it solves, and how a server exposes tools, resources, and prompts.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Diagram of an AI application connecting to external tools through the Model Context Protocol.'
tags: ['AI', 'LLM', 'MCP']
transitionSlug: 'model-context-protocol-mcp'
---

## What Is MCP?

The Model Context Protocol (MCP) is an open-source standard for connecting AI applications to external systems: local files, databases, APIs, and other tools. Anthropic open-sourced it in November 2024, and it has since grown into a broader ecosystem effort, now hosted by the Linux Foundation with support from major AI applications (Claude, ChatGPT) and editors (VS Code, Cursor).

The official docs describe it with a simple analogy: MCP is like a USB-C port for AI applications. Instead of every assistant needing a custom, one-off integration for every tool or data source, MCP gives both sides a common connector to build against.

## The Problem It Solves: M×N Integrations

Before MCP, every AI application that wanted to talk to an external system (a database, a ticketing tool, a calendar) needed its own bespoke integration for that system. With **M** AI applications and **N** external tools, you end up building and maintaining roughly **M×N** integrations: one per pair.

MCP flips that into an **M+N** problem: a tool author builds one MCP server, and any MCP-compatible AI application can talk to it without extra glue code. Application authors build one MCP client implementation and immediately get access to every MCP server in the ecosystem.

## Client-Server Architecture: Hosts, Clients, Servers

MCP defines three participants:

- **Host**: the AI application that coordinates everything, such as Claude Desktop, Claude Code, or VS Code with Copilot.
- **Client**: a component the host creates for each connection. Every client maintains a single, dedicated connection to one server.
- **Server**: a program that exposes context (data and actions) to clients through the protocol.

A host can hold several clients at once, one per connected server. If VS Code connects to a filesystem server and a Sentry server, it instantiates two separate MCP clients internally, each pinned to its own server.

Servers can run locally or remotely, and this maps to the two transports MCP supports:

- **stdio**: the client launches the server as a local subprocess and they talk over standard input/output. No network involved; typically one client per server.
- **Streamable HTTP**: the client talks to a remote server over HTTP (with optional Server-Sent Events for streaming), usually authenticated with OAuth or a bearer token. A remote server can serve many clients at once.

Underneath both transports, MCP exchanges JSON-RPC 2.0 messages: the transport just decides how those messages travel.

## What a Server Exposes: Tools, Resources, and Prompts

An MCP server can offer three kinds of primitives, each with a different "who's driving":

| Primitive     | What it is                                                                                                                                    | Who controls it |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **Tools**     | Executable functions with a JSON Schema for their inputs, e.g. `searchFlights`, `sendEmail`. The model decides when to call them.            | The model       |
| **Resources** | Read-only data identified by a URI, like `file:///report.pdf` or `calendar://events/2026`. The application decides how to fetch and use them. | The application |
| **Prompts**   | Reusable, parameterized templates (e.g. "plan a vacation") that combine specific tools and resources into a guided workflow.                  | The user        |

A client discovers what a server offers through list methods (`tools/list`, `resources/list`, `prompts/list`) before ever calling anything, so the available surface can change at runtime and servers can notify clients when it does.

## A Simple Practical Example

Here's a minimal MCP server built with the Python SDK, exposing a single tool. The SDK turns a type-hinted, documented function into a tool definition automatically:

```python
from mcp.server import MCPServer

mcp = MCPServer("weather")

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    # fetch and format forecast data...
    return "Sunny, 22°C"
```

From the outside, this server advertises one tool named `get_forecast` with an `inputSchema` requiring `latitude` and `longitude`. A host like Claude Desktop connects to it, lists its tools, and — when a user asks "what's the weather in Barcelona?" — the model decides to call `get_forecast`, the client sends `tools/call`, the server runs the function, and the result flows back into the conversation as context.

Nothing here is Claude-specific: any MCP-compatible host can talk to this exact server without touching its code.

## Conclusion

MCP doesn't make models smarter: it standardizes the plumbing between models and the systems they need to act on. By separating "how do I talk to a data source or tool" from "which AI application am I using," it turns a combinatorial integration problem into a linear one. If you're building an AI feature that needs to reach outside the model — files, APIs, internal tools — reaching for an existing MCP server, or writing a small one like the example above, is usually less work than inventing another one-off integration.
