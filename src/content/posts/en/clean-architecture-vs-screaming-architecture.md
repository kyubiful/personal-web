---
title: 'Clean Architecture vs Screaming Architecture: Structuring a Project by Use Cases'
pubDate: 2026-06-01
description: 'A practical comparison of Robert C. Martin''s Clean Architecture and Screaming Architecture, with a before/after example showing how to organize a codebase around business use cases instead of frameworks and technical layers.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Diagram comparing a layered folder structure with a use-case-driven folder structure.'
tags: ["Software Architecture", "Best Practices"]
transitionSlug: 'clean-architecture-vs-screaming-architecture'
---

## Two Ideas, One Author

Robert C. Martin ("Uncle Bob") introduced both concepts on his blog. In [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html) (2011), he asks a simple but uncomfortable question: if you look at the top-level folder structure of your project, does it tell you what the application *does*, or only which framework it uses? A year later, in [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) (2012), he formalized the layering and dependency rules that make that kind of structure possible.

They're not competing ideas — Screaming Architecture is the *visible outcome* of applying Clean Architecture correctly. One tells you *why* your folders should look a certain way; the other tells you *how* to get there.

## Screaming Architecture: What Your Folders Say About You

Martin's analogy is architectural in the literal sense: when you look at the blueprints of a building, they scream "house," "library," or "train station" — you don't need to be told. His challenge to developers is direct:

> "Architectures should not be _supplied_ by frameworks. Frameworks are tools to be used, not architectures to be conformed to."

Most codebases fail this test. Open a typical Node.js or Rails project and the first thing you see is `controllers/`, `models/`, `services/`, `routes/` — an org chart of technical roles, not a description of the business. You can't tell if it's a billing system or a blog engine until you dig several folders deep.

Martin's point is that the framework, the database, and the web itself are *details* — decisions that should be deferrable. A well-structured system should let you delay picking Express vs. Fastify, or Postgres vs. Mongo, without touching your business logic.

## Clean Architecture: The Mechanism Behind the Scream

Clean Architecture provides the structure that makes that deferral possible, organized as concentric circles: **Entities** (enterprise-wide business rules), **Use Cases** (application-specific logic that orchestrates entities), **Interface Adapters** (controllers, presenters, gateways), and **Frameworks & Drivers** (web frameworks, databases, UI — the outermost, most volatile layer).

The rule that holds it together is **the Dependency Rule**: source code dependencies can only point inward. Inner circles never know that outer circles exist — a use case doesn't import Express, and an entity doesn't know Postgres exists. As Martin puts it, "the overriding rule that makes this architecture work is The Dependency Rule."

The payoff is concrete: your business logic is independent of frameworks, testable without spinning up a database or an HTTP server, and free to swap infrastructure — "you can swap out Oracle or SQL Server, for Mongo, BigTable, CouchDB, or something else" — without rewriting the core.

## Before: A Layer-First Structure

Here's a typical Node/TypeScript project organized by technical layer:

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

Nothing here screams "e-commerce platform." To understand what the system actually does — place an order, issue an invoice, refund a customer — you have to open several files and mentally reconstruct the flow. Adding a new use case usually means touching four folders at once, and it's tempting to leak framework details (an Express `Request` object, a Mongoose schema) straight into what should be pure business logic.

## After: A Use-Case-First Structure

Reorganized around what the system *does*, following the Dependency Rule:

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
      OrderRepository.ts        # interface
  infrastructure/
    http/
      express/
        orderRoutes.ts
    persistence/
      postgres/
        PostgresOrderRepository.ts   # implements OrderRepository
```

`PlaceOrder.ts` depends only on `Order` entities and an `OrderRepository` interface — never on Express or Postgres. `PostgresOrderRepository.ts` lives in `infrastructure/`, implementing that interface. If you swapped Express for Fastify or Postgres for Mongo tomorrow, `use-cases/` and `entities/` wouldn't change a single line. Open the top-level `use-cases/` folder and the system tells you exactly what it's for: placing orders, issuing invoices, refunding customers — before you've read a single line of implementation.

## When This Is Worth It

This isn't free. For a small CRUD app or a short-lived prototype, the extra indirection (interfaces, dependency inversion, extra folders) can be overkill — you're paying structure costs for flexibility you'll never use. It pays off as business logic grows in complexity and needs to survive framework churn, multiple delivery mechanisms (web, CLI, batch jobs), or long-term maintenance by teams who need to onboard quickly by reading folder names, not tracing imports.

## Conclusion: Let Your Structure Talk

Clean Architecture and Screaming Architecture answer two different questions that lead to the same place. Clean Architecture asks "how do I keep business logic independent of infrastructure?" and answers with layers and a dependency rule pointing inward. Screaming Architecture asks "what should someone see when they open my project?" and answers: your use cases, not your framework.

The practical test is simple. Open your `src/` folder. If the first thing you see is `controllers`, `services`, and `models`, your architecture is screaming "web app." If it's `place-order`, `issue-invoice`, and `refund-customer`, it's screaming what your business actually does — and that's the structure that survives your next framework migration.
