# App Spec & Development Guidelines

Este documento define:

- Reglas de UI/UX
- Layout de la aplicación
- Estilo de desarrollo
- Convenciones técnicas
- Forma de trabajo con el asistente (Claude)

Este documento es obligatorio para cualquier implementación.

# Development Guidelines

- Desarrollo incremental (feature a feature)
- Explicar siempre el qué y el por qué
- No introducir complejidad innecesaria
- No hacer cambios grandes sin aprobación
- Priorizar claridad sobre velocidad
- Código siempre comentado
- Reutilizar componentes existentes
- Preguntar ante dudas

## 1. Visión General

Aplicación web para la gestión integral de una explotación ganadera.
Nombre inicial del proyecto: **Hermanos Rodríguez** (configurable).

El sistema será modular, escalable y totalmente responsive, con un diseño limpio, moderno y adaptable a múltiples dispositivos. HTML semántico, accesible y con buenas prácticas de SEO. Primordial la usabilidad y la experiencia de usuario.

Desarrollo progresivo, función a función, sin prisas y asegurando la consistencia del producto en cada paso. Analizar bien antes de ejecutar.

---

## 2. Objetivos

* Centralizar la gestión de la explotación ganadera
* Facilitar el control de animales, eventos, finanzas, infraestructuras y operaciones
* Permitir escalabilidad a nuevos módulos y especies (vacuno, porcino, etc.)
* Mantener una arquitectura clara y bien documentada

---

## 3. Stack Tecnológico

### Frontend

* Framework: Next.js
* Componentes UI: shadcn/ui
* Estilos: Tailwind CSS
* Enfoque: Mobile-first

### Backend / Datos

* Base de datos: Supabase
* Almacenamiento de archivos: Supabase Storage

### Despliegue

* Frontend: Vercel

---

## 4. Principios de Arquitectura

* Arquitectura modular (por funcionalidades)
* Bajo acoplamiento entre módulos
* Código limpio y mantenible
* Escalabilidad horizontal (nuevos módulos)
* Documentación exhaustiva


* Código simple, limpio, ordenado, bien comentado y siguiendo las mejores prácticas de desarrollo.
* Intentar reutilizar componentes y código existente siempre que sea posible.

---

## 5. Layout de la Aplicación

### Estructura global

* Sidebar (menú lateral colapsable; se mostrará por defecto y en tablets o inferior se colapsará automáticamente. En mobile estará totalmente escondido por defecto y se mostrará con un botón que pasará a estar en el Header)
* Header (cabecera)
* Contenido principal
* Footer

Notas:

* NO incluir breadcrumbs en ningún lugar.

---

### 5.1 Sidebar

Alineado a la izquierda. Irá de arriba a abajo ocupando todo el alto de la pantalla. En desktop se mostrará por defecto y en tablets o inferior se colapsará automáticamente (se mostrará una barra lateral más estrecha con solo los iconos). 
En mobile estará totalmente escondido por defecto para no ocupar espacio en la pantalla y se mostrará con un botón que pasará a estar en el Header.

En la parte superior del sidebar: Logo + Nombre de la explotación (configurable).
A continuación se mostrará el menú.

Elementos Menú (con iconos representativos para cada sección):

* Inicio (Dashboard)
* Calendario
* Vacuno

  * Listado de animales
  * Crear / editar animal
  * Ficha de animal

* Porcino (fase futura)

  * Listado de animales
  * Crear / editar animal
  * Ficha de animal
* Infraestructuras (fase futura)
* Finanzas (fase futura)
* Estadísticas (fase futura)
* Configuración
* Botón para mostrar/colapsar sidebar

---

### 5.2 Header

Será siempre visible (position fixed, top: 0) y ocupará todo el ancho de la pantalla que no ocupa el sidebar. Tendrá un z-index superior al del contenido principal, que se irá ocultando por debajo del header cuando se haga scroll. Para dar sensación de que el header está "encima" del contenido principal, se le pondrá un borde inferior con un sombreado muy suave.

Elementos:

(solo en mobile):
* Logo (alinear a la izquierda)
* Botón para abrir/cerrar sidebar  (alinear totalmente a la derecha)

(en todos los dispositivos)
* alinear a la izquierda:
  * Buscador global (ocupará el espacio disponible, teniendo un ancho máximo de 400px. En mobile se sustituirá por un icono de lupa que al pulsarlo mostrará el buscador por debajo del header).
* alinear a la derecha:
  * Información meteorológica (ubicación de la explotación) --> Ocultar en mobile.
  * Notificaciones (campana)
  * Avatar del usuario


---

### 5.3 Footer

Será siempre visible (position fixed, bottom: 0) y ocupará todo el ancho de la pantalla que no ocupa el sidebar. Tendrá un z-index superior al del contenido principal, que se irá mostrando por debajo del footer cuando se haga scroll. Para dar sensación de que el footer está "encima" del contenido principal, se le pondrá un borde superior con un sombreado muy suave.

* Texto de copyright
* Fecha actual


---

### 5.4 Contenido principal

* Contenido dinámico según el módulo seleccionado

    * Tendrá un título principal dinámico según la sección seleccionada en el sidebar.
    * por debajo del título se mostrarán el resto de elementos, según la sección

* Debe ocupar todo el espacio disponible menos el header y el footer
    * en la mayoría de secciones tendrá un ancho máximo de 1200px y estará centrado
    * en algunos casos, podría ser necesario que ocupe todo el ancho disponible (ej: calendario, estadísticas (futuro), etc.)
    * será una anchura fluída, sin saltos por cada breakpoint.
    * en mobile, el contenido principal ocupará todo el ancho disponible menos el padding lateral

* Padding 
    * superior: del doble de la altura del header para que no se solape con el header
    * inferior: del doble de la altura del footer para que no se solape con el footer
    * lateral: variable (clamp, según el ancho de pantalla), de máximo 20px (en desktop) y mínimo 10px (en mobile)

* Al hacer scroll, se desplazará por debajo del header y del footer
    

---

## 6. Configuración de la Aplicación

Debe ser posible:

* Modificar el nombre de la explotación
* Subir logo / imagen representativa
* Configurar ubicación de la explotación (para información meteorológica)
* Configurar parámetros básicos del sistema
* activar / desactivar módulos
* añadir razas
* crear usuarios
* Configurar usuarios (roles y permisos)


---

## 7. Módulos

### 7.1 Dashboard

* Número total de animales
* Información meteorológica (ubicación de la explotación)
* Próximos eventos
* Resumen rápido de actividad
* Métricas básicas

---

### 7.2 Módulo de Vacuno (FASE 1 - PRIORITARIO)

#### Listado de animales

#### Alta / Edición de animal

#### Ficha de animal

#### Funcionalidad avanzada

* Control genealógico (relaciones padre/madre/cría)
* Visualización básica de árbol genealógico (fase futura)

---

### 7.3 Módulo de Porcino (FASE 2)

* Misma estructura base que vacuno + gestión de lotes
* Adaptable a necesidades específicas

---

### 7.4 Módulo de Calendario

#### Vista calendario

* Vista mensual, semanal y diaria
* Días con eventos destacados
* Añadir nuevo evento
* Editar evento
* Eliminar evento
* Ver detalle


---

### 7.5 Módulo de Estadísticas (FASE FUTURA)

* Visualización de datos agregados
* Ejemplos:

  * Evolución del número de animales
  * Distribución por raza
  * Eventos realizados
* Uso de gráficos (charts)


---

### 7.6 Módulo de Instalaciones (FASE FUTURA)

* Cercados
* Corrales
* Naves
* Otros espacios
* Vehículos
* Maquinaria


---

## 8. Gestión de Archivos

Para múltiples entidades:

* Animales
* Eventos
* Infraestructuras

Se debe permitir:

* Subir imágenes
* Subir múltiples archivos
* Asociar archivos a registros

---

## 9. Modelo de Datos (Pendiente de definir)



---

## 10. UI / UX

* Diseño limpio y moderno
* Uso consistente de shadcn/ui
* Buen uso de espacios y jerarquía visual
* Uso de TypeScript
* Uso de Tailwind CSS
* Uso de Next.js
* Uso de Supabase
* HTML semántico
* Accesibilidad básica

---

## 11. Temas

* Modo claro
* Modo oscuro
* Toggle de cambio de tema

---

## 12. Responsive

* 100% adaptable:

  * Mobile
  * Tablet
  * Desktop

Sidebar:

* Desktop: colapsable
* Mobile: oculto. Se mostrará al clicar en el botón de menú del header.

---

## 13. Estrategia de Desarrollo

* Desarrollo incremental
* No me gusta el código espagueti, quiero que el código esté bien estructurado y sea fácil de mantener
* Actúa como un ingeniero de software senior con amplia experiencia en desarrollo web con Next.js, TypeScript, Tailwind CSS, Supabase, etc., con capacidad para tomar decisiones técnicas y proponer mejoras.
    * Usa TypeScript
    * Usa Tailwind CSS + DaisyUI
    * Usa Next.js
    * Usa Supabase
    * Usa HTML semántico
    * Usa accesibilidad básica
    * Usa shadcn/ui
    * Reutiliza componentes siempre que puedas
* Nunca hagas cambios grandes sin preguntarme antes, a no ser que sea para corregir un error que tú mismo has introducido. En ese caso, explícame el error y cómo lo has corregido.

* Mi objetivo es APRENDER
    * Quiero que me expliques lo que vas haciendo
    * Quiero ir paso a paso, funcionalidad por funcionalidad para entender bien el código y poderlo validar
    * Quiero saber las decisiones que tomas, aprender cómo está hecha la aplicación y poder modificarla en un futuro
* Añadir comentarios en el código
* Pregúntame si no entiendes algo, no te cortes

* Prioridad:

  1. Base del sistema (header, sidebar, footer, responsive, temas, etc.)
  2. Módulo de vacuno
  3. Módulo de calendario
  4. Todo responsive y con buen diseño
  5. Respetar las buenas prácticas de JS, TypeScript, Next JS, shadcn/ui, accesibilidad, Tailwind CSS, etc.
  6. Resto de módulos progresivamente

---

## 14. Consideraciones Futuras

* Multi-especie completa
* Sistema de permisos
* Notificaciones
* API desacoplada
* Integraciones externas (ej: meteorología API)

---

## 15. Documentación

Cada módulo debe incluir:

* Descripción
* Componentes
* Flujo de datos
* Decisiones técnicas

---
