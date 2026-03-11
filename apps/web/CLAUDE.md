## Skills & Context
- **Reglas de Desarrollo:** Antes de generar código, consulta y aplica estrictamente las convenciones definidas en la carpeta `.claude/`.

## Estándares de Frontend
- **Mobile First:** Implementar siempre un enfoque "mobile-first" utilizando Media Queries o utilidades de Tailwind (si aplica).
- **Responsive Design:** Todo componente o página debe ser 100% responsivo.
- **Unidades Relativas:** Priorizar el uso de `rem`, `em`, `vh/vw` y porcentajes sobre valores fijos en `px`.
- **Flexbox/Grid:** Utilizar layouts flexibles para asegurar la adaptabilidad en diferentes tamaños de pantalla (Desktop, Tablet, Mobile).

## Manejo de Formularios y Validación
- **React Hook Form:** Es obligatorio para la gestión de estado de formularios.

Zod: Todas las validaciones de esquemas deben definirse con Zod. El esquema debe ser la única fuente de verdad para los tipos de los inputs.

Integración: Usar el resolver de Zod para conectar ambos: @hookform/resolvers/zod.

## Mutaciones de Datos (Server Actions)
Prohibido API Routes: No crear rutas en /api para mutaciones internas. Usar Server Actions exclusivamente.

Ubicación: Definir las acciones en archivos actions.ts dentro de sus respectivos módulos.

Type Safety: Las acciones deben validar el formData o el payload usando el esquema de Zod antes de procesar la lógica.

## Rate Limiting (Client-Side / Edge)
Implementar un rate limiter preventivo en el middleware de Next.js o mediante una librería como upstash/ratelimit si se requiere persistencia en el Edge.