# Reglas para Cursor AI

Este archivo contiene reglas específicas para agentes de IA trabajando en este proyecto.

## Contexto del Proyecto

Este es el proyecto Overtime, una plataforma de gestión de torneos deportivos construida con:
- Backend: NestJS + TypeScript + Prisma + Supabase
- Frontend: Next.js 16+ (App Router) + TypeScript + Tailwind CSS

## Reglas Generales

1. **Siempre consultar** `.agent-rules/` antes de hacer cambios
2. **TypeScript estricto** - Nunca usar `any`, siempre tipos explícitos
3. **Modularidad** - Cada feature en su propio módulo
4. **Seguridad primero** - Validar todo en backend, nunca confiar en frontend
5. **Testing** - Agregar tests para nueva funcionalidad crítica

## Estructura de Archivos

- Backend: Seguir estructura en `RFC-001-Arquitectura-Sistema-Torneos.md` sección 4.1.1
- Frontend: Seguir estructura en `RFC-001-Arquitectura-Sistema-Torneos.md` sección 4.1.2

## Convenciones de Código

### Backend (NestJS)
- Usar DTOs con class-validator para validación
- Lógica de negocio en servicios, no en controladores
- Usar PrismaService para acceso a datos
- Manejar errores con excepciones de NestJS
- Ver `.agent-rules/backend-guidelines.md` para detalles

### Frontend (Next.js)
- Server Components por defecto, Client Components solo cuando necesario
- Usar servicios en `modules/[module]/services/` para API calls
- Componentes en `modules/[module]/components/`
- Tailwind CSS para estilos
- Ver `.agent-rules/frontend-guidelines.md` para detalles

### Base de Datos
- Usar Prisma para schema y queries
- Índices en campos frecuentemente consultados
- Soft deletes con `deletedAt`
- Ver `.agent-rules/database-guidelines.md` para detalles

## APIs

- RESTful conventions
- Validación en DTOs
- Códigos de estado HTTP apropiados
- Paginación en listados
- Ver `.agent-rules/api-guidelines.md` para detalles

## Testing

- Unit tests para servicios
- Integration tests para APIs
- E2E tests para flujos críticos
- Cobertura mínima: 70%
- Ver `.agent-rules/testing-guidelines.md` para detalles

## Git

- Conventional Commits
- Branches descriptivos (feature/, fix/, hotfix/)
- PRs pequeñas y enfocadas
- Ver `.agent-rules/git-workflow.md` para detalles

## Reglas de Negocio Importantes

1. Un equipo solo puede estar en **1 categoría por torneo**
2. Un jugador **NO puede estar en múltiples equipos de la misma categoría**
3. Los playoffs **NO se generan hasta completar la fase regular**
4. Oficiales de mesa solo pueden anotar en **sus partidos asignados**
5. Equipos que no se presentan pierden **20-0** (básquet)

## Cuando Crear Nuevos Archivos

1. Seguir la estructura de carpetas definida
2. Usar nombres descriptivos y consistentes
3. Agregar tipos TypeScript apropiados
4. Incluir comentarios cuando la lógica no sea obvia
5. Agregar tests básicos

## Cuando Modificar Archivos Existentes

1. Mantener consistencia con el código existente
2. No romper funcionalidad existente
3. Agregar tests si se modifica lógica crítica
4. Actualizar documentación si es necesario

## Preguntas Frecuentes

- **¿Dónde va la lógica de negocio?** → Servicios (backend) o hooks (frontend)
- **¿Cómo validar datos?** → DTOs con class-validator (backend), zod/react-hook-form (frontend)
- **¿Cómo manejar errores?** → Excepciones de NestJS (backend), try/catch con mensajes amigables (frontend)
- **¿Cómo estructurar componentes?** → Un componente por archivo, props tipadas, hooks para lógica

## Referencias Rápidas

- Arquitectura: `RFC-001-Arquitectura-Sistema-Torneos.md`
- Roadmap: `ROADMAP-Implementacion.md`
- Estructura de carpetas: `RFC-001-Arquitectura-Sistema-Torneos.md` sección 4.1
- Guías detalladas: `.agent-rules/*.md`

