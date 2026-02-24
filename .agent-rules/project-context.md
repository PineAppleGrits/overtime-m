# Contexto del Proyecto - Overtime

## Descripción General

Overtime es una plataforma de gestión de torneos deportivos que actualmente soporta básquet y está diseñada para expandirse a múltiples deportes.

## Stack Tecnológico

### Backend
- **Framework:** NestJS con TypeScript
- **ORM:** Prisma
- **Base de Datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth con Google OAuth
- **Hosting:** Render

### Frontend
- **Framework:** Next.js 16+ (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Hosting:** Vercel

## Estructura del Proyecto

```
overtime-workspace/
├── overtime-be/          # Backend (NestJS)
├── overtime-fe/          # Frontend (Next.js)
└── .agent-rules/         # Reglas para agentes
```

## Principios Fundamentales

1. **Modularidad:** Cada funcionalidad debe estar en su propio módulo
2. **Type Safety:** Usar TypeScript estrictamente, evitar `any`
3. **Separación de Responsabilidades:** Backend para lógica de negocio, Frontend para presentación
4. **Escalabilidad:** Pensar en expansión futura (múltiples deportes)
5. **Seguridad:** Validar todo en backend, nunca confiar en el frontend

## Módulos Principales

1. Usuarios y Autenticación
2. Equipos y Deportes
3. Torneos (con Categorías y Zonas)
4. Canchas y Locaciones
5. Partidos (con estadísticas en vivo)
6. Personal (Árbitros, Oficiales, Fotógrafos)
7. Inscripciones
8. Pagos
9. Roles y Permisos
10. Notificaciones y Mensajería
11. Reportes
12. Configuraciones
13. SEO y Analytics
14. Soporte (Tickets)

## Estados Importantes

### Torneos
- `draft` → `visible` → `inscripción_cerrada` → `finalizado` → `archivado`
- También puede ser `invisible`

### Partidos
- `programado` → `en_curso` → `finalizado`
- También puede ser: `suspendido`, `cancelado`, `reprogramado`

### Inscripciones
- `pendiente` → `aprobada` → `pagada`
- También puede ser: `rechazada`

## Reglas de Negocio Críticas

1. Un equipo solo puede estar en **1 categoría por torneo**
2. Un jugador **NO puede estar en múltiples equipos de la misma categoría**
3. Los oficiales de mesa solo pueden anotar estadísticas en **sus partidos asignados**
4. Equipos que no se presentan pierden **20-0** (básquet)

## Referencias

- Ver `RFC-001-Arquitectura-Sistema-Torneos.md` para arquitectura detallada
- Ver `ROADMAP-Implementacion.md` para plan de implementación
- Ver `ESTRUCTURA-ENTREGAS.md` para detalles de entregas

