---
title: 'React 19.3: View Transitions y Fragment Refs llegan a estable'
pubDate: 2026-09-11
description: 'React 19.3 estabiliza el componente ViewTransition y los Fragment Refs, y suma browser() para renderizado en servidor, soporte de Trusted Types y Context directo en Server Components. Qué cambia y cómo usarlo.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Una interfaz animándose de una pantalla a otra mediante una transición fluida.'
tags: ['React', 'JavaScript']
transitionSlug: 'react-19-3-view-transitions-fragment-refs'
---

## Dos APIs que llevaban un año en fase experimental

React 19.3 se publicó hace apenas un par de días y consolida dos piezas que el equipo de React llevaba adelantando desde su post de labs de abril de 2025: el componente `<ViewTransition>` y los Fragment Refs. Ambas pasan de experimental a estable en esta versión, sin cambios incompatibles. Si vienes de la 19.2 (la que trajo `<Activity>`, `useEffectEvent` y `cacheSignal`), esta es la continuación natural de esa misma línea: animaciones y gestión de foco/medición sin salir del modelo declarativo de React.

## `<ViewTransition>`: animar sin salir de React

El componente `<ViewTransition>` envuelve a otro componente y usa la View Transition API del navegador para animar automáticamente cuatro situaciones: que el componente **entre** (se monta), **salga** (se desmonta), se **actualice** (cambia su contenido o estilo), o se **comparta** (un `<ViewTransition>` con nombre se mueve de un sitio a otro del árbol).

```jsx
import { ViewTransition } from 'react';

{isShowing && (
  <ViewTransition>
    <Component />
  </ViewTransition>
)}
```

Hay un requisito que es fácil pasar por alto: la animación solo dispara si la actualización que la provoca está marcada como una Transition, es decir, si viene de `startTransition()`, de una revelación de `<Suspense>`, o de `useDeferredValue()`. Un `setState` normal sigue siendo inmediato y no anima nada, precisamente para no introducir latencia en interacciones que deben sentirse instantáneas.

Para personalizar la animación tienes dos caminos: clases CSS ligadas al ciclo de vida de la transición, o los eventos `onEnter`, `onExit`, `onShare` y `onUpdate` si prefieres controlar la animación con la Web Animations API directamente.

### `addTransitionType`: la misma transición, distinta animación según la causa

Lo interesante de esta versión es que ya no basta con saber *qué* cambió, sino *por qué* cambió. `addTransitionType` te deja etiquetar la causa de una Transition para que el mismo `<ViewTransition>` anime distinto según el contexto:

```jsx
function nextSlide() {
  startTransition(() => {
    addTransitionType('next');
    setCurrentSlide(c => c + 1);
  });
}

function previousSlide() {
  startTransition(() => {
    addTransitionType('previous');
    setCurrentSlide(c => c - 1);
  });
}

<ViewTransition
  enter={{ next: 'from-right', previous: 'from-left' }}
  exit={{ next: 'to-left', previous: 'to-right' }}
>
  <Page />
</ViewTransition>
```

El navegador expone ese tipo mediante el pseudo-selector `:active-view-transition-type(...)`, así que también puedes resolver la variación puramente en CSS si lo prefieres.

### Integración con Suspense

Envolver un `<Suspense>` dentro de un `<ViewTransition>` anima la transición del fallback al contenido final como una actualización. La recomendación del propio equipo es explícita: el fallback debe aparecer de inmediato y sin animación, y solo la transición de fallback a contenido final debe animarse. Para lograrlo sin que se cuelen animaciones donde no tocan:

```jsx
<ViewTransition update="auto" default="none">
  <Suspense fallback={<Fallback />}>
    <Component />
  </Suspense>
</ViewTransition>
```

Es el mismo patrón que conviene usar para imágenes y fuentes: envolverlas en `<ViewTransition>` más `<Suspense>` evita el parpadeo de contenido a medio cargar.

## Fragment Refs: refs sin un div de relleno

Este es, para mí, el cambio con más impacto silencioso de la versión. Hasta ahora, si un componente renderizaba varios hermanos sin un único nodo DOM padre, no tenías forma de engancharle un ref: la única salida era envolver todo en un `<div>`, y ese div terminaba interfiriendo con el CSS (grids, flexbox, selectores de hermano directo...).

React 19.3 permite pasar un ref directamente a un `<Fragment>`:

```jsx
function Component() {
  const fragmentRef = useRef(null);

  useEffect(() => {
    fragmentRef.current.focus();
  }, []);

  return (
    <Fragment ref={fragmentRef}>
      {posts.map(post => (
        <Heading key={post.id}>{post.title}</Heading>
      ))}
    </Fragment>
  );
}
```

Ese ref no apunta a un nodo DOM real (el Fragment no crea ninguno), sino a un `FragmentInstance` que opera sobre el conjunto de hijos como grupo: `focus()` enfoca el primer hijo enfocable, `focusLast()` el último, `getClientRects()` mide todos los hijos de primer nivel, y `observeUsing()` / `unobserveUsing()` te dejan conectar un `IntersectionObserver` o `ResizeObserver` sin tener que iterar los hijos manualmente. Un caso de uso típico, un `InView` que detecta si cualquiera de sus hijos está en viewport:

```jsx
export default function InView({ onChange, children }) {
  const fragmentRef = useRef(null);

  useLayoutEffect(() => {
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      });
      onChange(visible.size > 0);
    });

    fragmentRef.current.observeUsing(observer);
    return () => fragmentRef.current.unobserveUsing(observer);
  }, [onChange]);

  return <Fragment ref={fragmentRef}>{children}</Fragment>;
}
```

Antes, este componente habría necesitado un wrapper DOM solo para tener algo a lo que engancharle el observer. Ahora el Fragment cumple ese rol sin afectar en nada el layout.

## `browser()`: opt-out explícito de renderizado en servidor

Cualquiera que haya hecho SSR se ha topado con el mismo problema: un componente que depende de una API de navegador (`localStorage`, la zona horaria, `window`) no tiene nada sensato que renderizar en el servidor. El parche habitual era el patrón `mounted`/`isBrowser` con un `useEffect` que fuerza un segundo render en cliente. React 19.3 lo resuelve de forma nativa con `browser()`:

```jsx
import { use } from 'react';
import { browser } from 'react-dom';

function TimeZone() {
  use(browser()); // suspende en servidor, no suspende en cliente
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <p>{timeZone}</p>;
}
```

En servidor, `use(browser())` dispara Suspense y se sirve el fallback en el HTML inicial. En cliente, tras la hidratación, no suspende y el componente renderiza con normalidad. Es la misma idea que un custom hook `useBrowserQuery` puede aprovechar para decidir si necesita datos iniciales del servidor o puede resolver todo en cliente, sin duplicar lógica de detección de entorno en cada componente.

## Dos cambios menores que vale la pena conocer

- **Trusted Types de verdad**: React ya no fuerza la coerción de valores a string (`'' + value`) antes de pasarlos al DOM. Objetos `TrustedHTML`, `TrustedScript` y `TrustedScriptURL` llegan intactos, lo que hace viable usar `Content-Security-Policy: require-trusted-types-for 'script'` con React sin workarounds.
- **Context directo en Server Components**: ya no necesitas un componente `'use client'` intermedio solo para envolver un `Context.Provider`. Un Server Component puede importar el `Context` desde un módulo `'use client'` y renderizarlo directamente:

```jsx
// user-context.js
'use client';
export const UserContext = createContext(null);

// layout.js (Server Component)
import { UserContext } from './user-context';

export async function Layout({ children }) {
  const currentUser = await getCurrentUser();
  return <UserContext value={currentUser}>{children}</UserContext>;
}
```

## Conclusión

Ninguna de estas APIs reinventa cómo se escribe React: extienden el mismo modelo declarativo a dos zonas que hasta ahora quedaban fuera de su alcance, animaciones nativas del navegador y gestión de foco/medición sobre grupos de nodos sin padre común. Lo más significativo de 19.3 no es una función aislada, sino la señal de dirección: después de labs, experimental, y ahora estable, el equipo de React sigue tratando las transiciones visuales y el acceso a APIs de bajo nivel del DOM como parte central de la librería, no como una capa aparte que dejas en manos de Framer Motion o de refs manuales. Si tu app hace transiciones de página con CSS a mano o mete divs de relleno solo para tener algo a lo que apuntar un ref, esta versión probablemente ya te ahorra ese código.
