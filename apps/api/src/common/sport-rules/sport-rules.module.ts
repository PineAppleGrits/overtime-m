import { Global, Module } from '@nestjs/common';
import { SportRulesRegistry } from './sport-rules.registry';

/**
 * Módulo global para acceder a las reglas de deporte+modalidad.
 *
 * Inyectar `SportRulesRegistry` y resolver con `.get(sportCode, modality)`.
 */
@Global()
@Module({
  providers: [SportRulesRegistry],
  exports: [SportRulesRegistry],
})
export class SportRulesModule {}
