---
title: 'Omarchy: la distro Arch Linux opinionada de DHH para developers'
pubDate: 2026-08-29
description: 'Omarchy convierte una instalación de Arch Linux en un escritorio Hyprland completo, minimalista y orientado a teclado con un solo comando. Qué incluye, cómo se instala y por qué acaba de recibir 10 millones de dólares de respaldo.'
author: 'Sergio Zabala'
image:
  url: '/placeholder.webp'
  alt: 'Escritorio Linux minimalista con ventanas en mosaico estilo Hyprland.'
tags: ['Linux', 'Developer Tools']
transitionSlug: 'omarchy-arch-linux-opinionado'
---

## El problema: configurar Arch bien lleva semanas

Instalar Arch Linux "a mano" es casi un rito de iniciación: particionado, cifrado, elegir un window manager, configurar Wayland, escribir tu propio `waybar` y `hyprland.conf`, resolver conflictos de paquetes en el AUR, ajustar el tema, los atajos de teclado, las fuentes... El resultado, cuando llega, suele ser un escritorio hermoso y rapidísimo. El costo es que llegar ahí puede llevarte semanas de ensayo y error, y cada actualización del sistema es una oportunidad para que algo se rompa.

**Omarchy**, creado por David Heinemeier Hansson (DHH, el autor de Ruby on Rails y cofundador de 37signals/Basecamp), parte de una premisa simple: ¿y si alguien ya tomó esas cien decisiones de configuración por ti, y las dejó documentadas y versionadas en un repositorio?

## Qué es exactamente

Omarchy es, en el fondo, Arch Linux con [Hyprland](https://hyprland.org/) (un compositor Wayland de mosaico, con animaciones fluidas) como base, más una capa de configuración opinionada encima: temas, atajos, aplicaciones por defecto y un instalador que hace todo el trabajo pesado. No es una distro desde cero con su propio kernel o gestor de paquetes; es un *respin* de Arch pensado para llegar a un escritorio productivo en minutos en lugar de semanas.

El proyecto ofrece dos caminos de instalación:

- **ISO completa**: se graba en un USB, se bootea, y el instalador se encarga del particionado, el cifrado de disco completo (activado por defecto) y la instalación de paquetes.
- **Script sobre un Arch existente**: para quienes ya tienen Arch corriendo y quieren capas Omarchy encima sin reinstalar desde cero.

Un detalle práctico si lo probás en hardware real: puede ser necesario desactivar Secure Boot y ajustar la configuración de TPM en la BIOS, porque el cifrado de disco completo por defecto puede chocar con esas configuraciones según el equipo.

## Qué trae por defecto

Omarchy no se limita al window manager: viene con una selección curada de software listo para usar, entre otros Neovim como editor, Chromium como navegador, LibreOffice, Spotify y Zoom. Además mantiene su propio repositorio de paquetes, separado de los repos oficiales de Arch y del AUR, con canales de actualización propios para los paquetes específicos de Omarchy, sin perder acceso al ecosistema más amplio de Arch.

El sistema de temas permite cambiar la paleta de colores y el aspecto general del escritorio de forma centralizada, en lugar de tener que tocar media docena de archivos de configuración por separado.

## La filosofía: todo por teclado

Al estar construido sobre Hyprland, el mosaico de ventanas es automático: no arrastrás ni redimensionás ventanas con el mouse, el compositor las organiza según reglas de tiling. Los atajos de teclado cubren la navegación entre espacios de trabajo, el lanzamiento de aplicaciones y el manejo de ventanas. Para alguien que ya vive en Neovim, tmux o Zellij, la lógica es familiar: minimizar el uso del mouse y maximizar la velocidad de la memoria muscular.

La curva de aprendizaje es real. Si venís de un entorno de escritorio tradicional (GNOME, KDE, macOS, Windows), esperá un período de adaptación mientras internalizás los atajos y el modelo mental de tiling.

## Un respaldo de 10 millones de dólares

Aunque el proyecto arrancó recién en junio de 2025, en agosto de 2026 se anunció la creación de la **Omacom Foundation**, con un respaldo inicial de 8 millones de dólares que se amplió a 10 millones con aportes de figuras vinculadas a Shopify, Stripe, Dell, Block, Cloudflare, Dropbox y la propia 37signals, entre otros. Framework, la empresa conocida por sus laptops reparables, también pasó a patrocinar Omarchy y Hyprland directamente.

Ese crecimiento institucional convive con controversia: parte de la comunidad cuestiona el liderazgo de DHH y algunos investigadores de seguridad plantearon reparos serios sobre decisiones de diseño del proyecto. La versión 4.0.1, lanzada a mediados de agosto de 2026, fue justamente una actualización de seguridad. Vale la pena tenerlo en cuenta antes de adoptarlo en una máquina con datos sensibles: revisá el changelog y las discusiones de seguridad de la comunidad antes de instalarlo.

Omarchy también tiene un proyecto hermano, **Omakub**, con la misma filosofía pero sobre Ubuntu en lugar de Arch, para quienes quieren la experiencia opinionada sin salir de una base más tradicional.

## ¿Para quién tiene sentido?

Omarchy apunta a developers experimentados que quieren un escritorio veloz, bonito y manejado por teclado, sin invertir semanas en configurarlo desde cero, y que están dispuestos a aceptar decisiones ya tomadas por otra persona. Si preferís construir tu configuración pieza por pieza y entender cada línea de tu `hyprland.conf`, probablemente el valor de Omarchy sea menor para vos: literalmente ya hiciste el trabajo que Omarchy automatiza.

## Conclusión

Omarchy es un ejemplo claro de un patrón que se repite en herramientas para developers: tomar cien decisiones de configuración razonables y empaquetarlas para que otra persona no tenga que repetirlas. El respaldo económico reciente sugiere que el proyecto seguirá creciendo, pero la controversia alrededor de su liderazgo y algunas decisiones de seguridad son parte legítima de la evaluación antes de instalarlo en un equipo de trabajo. Si tu objetivo es un escritorio Linux minimalista, rápido y por teclado, y no te importa heredar las decisiones de otra persona, vale la pena probarlo en una máquina de prueba antes de comprometer tu equipo principal.
