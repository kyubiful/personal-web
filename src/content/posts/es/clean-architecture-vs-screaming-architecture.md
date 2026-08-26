---
title: 'Clean Architecture vs Screaming Architecture: cómo estructurar un proyecto por casos de uso'
pubDate: 2026-06-01
description: 'Una comparación práctica entre Clean Architecture y Screaming Architecture de Robert C. Martin, con un ejemplo antes/después que muestra cómo organizar un proyecto según sus casos de uso en lugar de por frameworks y capas técnicas.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Diagrama comparando una estructura de carpetas por capas con una estructura orientada a casos de uso.'
tags: ['Software Architecture', 'Best Practices']
transitionSlug: 'clean-architecture-vs-screaming-architecture'
---

## Dos ideas, un mismo autor

Robert C. Martin ("Uncle Bob") presentó ambos conceptos en su blog. En [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html) (2011) plantea una pregunta sencilla pero incómoda: si miras la estructura de carpetas de primer nivel de tu proyecto, ¿te dice qué _hace_ la aplicación, o solo qué framework usa? Un año después, en [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) (2012), formalizó las capas y reglas de dependencia que hacen posible ese tipo de estructura.

No son ideas que compitan entre sí: Screaming Architecture es el _resultado visible_ de aplicar Clean Architecture correctamente. Una te dice _por qué_ tus carpetas deberían verse de cierta forma; la otra te dice _cómo_ llegar hasta ahí.

## Screaming Architecture: lo que tus carpetas dicen de ti

La analogía de Martin es arquitectónica en el sentido literal: cuando miras los planos de un edificio, estos gritan "casa", "biblioteca" o "estación de tren" sin que nadie te lo explique. Su reto a los desarrolladores es directo:

> "Las arquitecturas no deberían venir _dadas_ por los frameworks. Los frameworks son herramientas que se usan, no arquitecturas a las que hay que someterse."

La mayoría de los proyectos no pasan esta prueba. Abre un proyecto típico de Node.js o Rails y lo primero que ves es `controllers/`, `models/`, `services/`, `routes/`: un organigrama de roles técnicos, no una descripción del negocio. No puedes saber si es un sistema de facturación o un blog hasta que bajas varios niveles de carpetas.

El punto de Martin es que el framework, la base de datos y la propia web son _detalles_: decisiones que deberían poder postergarse. Un sistema bien estructurado te permite decidir más tarde entre Express o Fastify, entre Postgres o Mongo, sin tocar la lógica de negocio.

## Clean Architecture: el mecanismo detrás del grito

Clean Architecture aporta la estructura que hace posible ese aplazamiento, organizada en círculos concéntricos: **Entities** (reglas de negocio válidas para toda la empresa), **Use Cases** (lógica específica de la aplicación que orquesta a las entidades), **Interface Adapters** (controladores, presenters, gateways) y **Frameworks & Drivers** (frameworks web, bases de datos, UI: la capa más externa y volátil).

La regla que sostiene todo esto es **la Dependency Rule**: las dependencias del código fuente solo pueden apuntar hacia adentro. Los círculos internos nunca saben que los externos existen: un caso de uso no importa Express, y una entidad no sabe que Postgres existe. Como dice Martin, "la regla que hace que esta arquitectura funcione es la Dependency Rule".

El beneficio es concreto: la lógica de negocio queda independiente de los frameworks, es testeable sin levantar una base de datos o un servidor HTTP, y permite cambiar la infraestructura —"puedes reemplazar Oracle o SQL Server por Mongo, BigTable, CouchDB o cualquier otra cosa"— sin reescribir el núcleo.

## Antes: una estructura por capas técnicas

Un proyecto típico de Node/TypeScript organizado por capa técnica:

```
src/
  controllers/
    userController.ts
    orderController.ts
    invoiceController.ts
  services/
    userService.ts
    orderService.ts
    invoiceService.ts
  models/
    User.ts
    Order.ts
    Invoice.ts
  routes/
    userRoutes.ts
    orderRoutes.ts
```

Nada de esto grita "plataforma de e-commerce". Para entender qué hace realmente el sistema —crear un pedido, emitir una factura, reembolsar a un cliente— hay que abrir varios archivos y reconstruir el flujo mentalmente. Añadir un caso de uso nuevo suele implicar tocar cuatro carpetas a la vez, y es fácil que detalles del framework (un `Request` de Express, un schema de Mongoose) se filtren directamente en lo que debería ser lógica de negocio pura.

## Después: una estructura orientada a casos de uso

Reorganizado según lo que el sistema _hace_, siguiendo la Dependency Rule:

```
src/
  use-cases/
    place-order/
      PlaceOrder.ts
      PlaceOrder.test.ts
    issue-invoice/
      IssueInvoice.ts
      IssueInvoice.test.ts
    refund-customer/
      RefundCustomer.ts
  entities/
    Order.ts
    Invoice.ts
    Customer.ts
  interface-adapters/
    controllers/
      OrderController.ts
    gateways/
      OrderRepository.ts        # interfaz
  infrastructure/
    http/
      express/
        orderRoutes.ts
    persistence/
      postgres/
        PostgresOrderRepository.ts   # implementa OrderRepository
```

`PlaceOrder.ts` solo depende de las entidades `Order` y de una interfaz `OrderRepository`, nunca de Express o de Postgres. `PostgresOrderRepository.ts` vive en `infrastructure/` e implementa esa interfaz. Si mañana cambias Express por Fastify, o Postgres por Mongo, `use-cases/` y `entities/` no cambian ni una línea. Abre la carpeta `use-cases/` de primer nivel y el sistema te dice exactamente para qué sirve: crear pedidos, emitir facturas, reembolsar clientes, antes de haber leído una sola línea de implementación.

## Cuándo vale la pena

Esto no sale gratis. Para una aplicación CRUD pequeña o un prototipo de vida corta, la indirección adicional (interfaces, inversión de dependencias, más carpetas) puede ser excesiva: estás pagando el costo de una estructura pensada para una flexibilidad que nunca vas a usar. Compensa cuando la lógica de negocio crece en complejidad y necesita sobrevivir a cambios de framework, múltiples mecanismos de entrega (web, CLI, procesos batch) o el mantenimiento a largo plazo por equipos que necesitan entender el proyecto leyendo nombres de carpetas, no rastreando imports.

## Conclusión: deja que tu estructura hable

Clean Architecture y Screaming Architecture responden a dos preguntas distintas que llevan al mismo lugar. Clean Architecture pregunta "¿cómo mantengo la lógica de negocio independiente de la infraestructura?" y responde con capas y una regla de dependencia que apunta hacia adentro. Screaming Architecture pregunta "¿qué debería ver alguien al abrir mi proyecto?" y responde: tus casos de uso, no tu framework.

La prueba práctica es sencilla. Abre tu carpeta `src/`. Si lo primero que ves es `controllers`, `services` y `models`, tu arquitectura está gritando "aplicación web". Si ves `place-order`, `issue-invoice` y `refund-customer`, está gritando lo que tu negocio realmente hace, y esa es la estructura que sobrevive a tu próxima migración de framework.
