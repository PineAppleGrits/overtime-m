/**
 * Re-export del facade en clean architecture (W3.3).
 *
 * Antes vivía la implementación completa acá. Ahora está en
 * `application/services/eligibility.service.ts`. Este archivo se mantiene
 * para no romper imports `from '../eligibility/eligibility.service'` que
 * tienen `matches.service`, `registrations.service`, `teams.service` y
 * tests existentes.
 */
export { EligibilityService } from './application/services/eligibility.service';
