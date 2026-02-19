# Flujo de Trabajo con Git

## Branches

### Estrategia
- `main` - Producción (solo código estable)
- `develop` - Desarrollo (integración de features)
- `feature/` - Features nuevas
- `fix/` - Bug fixes
- `hotfix/` - Fixes urgentes de producción

### Nombres de Branches
```
feature/tournament-draft-status
fix/user-phone-validation
hotfix/payment-webhook-error
```

## Commits

### Formato
Usar Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` - Nueva funcionalidad
- `fix:` - Bug fix
- `docs:` - Documentación
- `style:` - Formato (no afecta código)
- `refactor:` - Refactorización
- `test:` - Tests
- `chore:` - Tareas de mantenimiento

### Ejemplos
```
feat(tournaments): add draft status to tournaments

- Add draft status enum
- Update tournament creation to default to draft
- Add status transition validation

Closes #123
```

```
fix(auth): resolve token expiration issue

The token was expiring too quickly. Increased expiration time
to 24 hours.

Fixes #456
```

## Pull Requests

### Título
- Descriptivo y claro
- Incluir número de issue si aplica
- Usar formato: `[Type] Description`

```
[Feature] Add tournament draft status
[Fix] Resolve token expiration issue
[Docs] Update API documentation
```

### Descripción
- Qué cambia y por qué
- Screenshots si es UI
- Checklist de verificación
- Referencias a issues

```markdown
## Descripción
Agrega estado "draft" a los torneos para permitir creación sin publicar.

## Cambios
- Agrega enum TournamentStatus con estado draft
- Actualiza creación de torneos para usar draft por defecto
- Agrega validación de transiciones de estado

## Checklist
- [x] Tests agregados
- [x] Documentación actualizada
- [x] Sin errores de linting
- [x] Probado localmente

## Issues
Closes #123
```

## Code Review

### Para el Autor
- PR pequeño y enfocado
- Descripción clara
- Tests incluidos
- Sin errores de linting

### Para el Revisor
- Revisar lógica y arquitectura
- Verificar tests
- Comentar constructivamente
- Aprobar cuando esté listo

## Merge

### Estrategia
- **Squash and Merge** para features
- **Merge Commit** para releases importantes
- **Rebase** para mantener historial limpio (opcional)

## Tags y Releases

### Versionado Semántico
- `MAJOR.MINOR.PATCH`
- `1.0.0` - Primera versión estable
- `1.1.0` - Nueva feature
- `1.1.1` - Bug fix

### Crear Tag
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## .gitignore

### Archivos a Ignorar
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/
```

## Conflictos

### Resolución
1. Actualizar branch local: `git pull origin develop`
2. Resolver conflictos manualmente
3. Marcar como resuelto: `git add .`
4. Continuar merge: `git commit`

### Prevención
- Pull frecuente de develop
- Branches pequeños
- Comunicación con equipo

## Best Practices

### DO
- ✅ Commits pequeños y frecuentes
- ✅ Mensajes descriptivos
- ✅ Pull antes de push
- ✅ Branches descriptivos
- ✅ PRs pequeñas y enfocadas

### DON'T
- ❌ Commits grandes con múltiples cambios
- ❌ Mensajes genéricos ("fix", "update")
- ❌ Push directo a main/develop
- ❌ Commits de archivos generados
- ❌ Force push a branches compartidos

