import { Injectable, Logger } from '@nestjs/common';
import { Modality, SportCode, SportRules } from './sport-rules.types';
import { Basketball5v5Rules } from './strategies/basketball-5v5.rules';
import { Basketball3v3Rules } from './strategies/basketball-3v3.rules';

/**
 * Registro central de strategies de reglas por deporte+modalidad.
 *
 * Resolución: `get(sportCode, modality)` devuelve la strategy correcta
 * o lanza si no hay match. Para listar lo soportado: `list()`.
 */
@Injectable()
export class SportRulesRegistry {
  private readonly logger = new Logger(SportRulesRegistry.name);
  private readonly strategies = new Map<string, SportRules>();

  constructor() {
    this.register(new Basketball5v5Rules());
    this.register(new Basketball3v3Rules());
  }

  private register(rules: SportRules): void {
    this.strategies.set(rules.key, rules);
  }

  get(sportCode: SportCode, modality: Modality): SportRules {
    const key = `${sportCode}_${modality}`;
    const rules = this.strategies.get(key);
    if (!rules) {
      throw new Error(
        `No hay strategy de reglas para sport="${sportCode}" modality="${modality}".`,
      );
    }
    return rules;
  }

  /** Devuelve `null` si no hay match (versión segura). */
  tryGet(sportCode: SportCode, modality: Modality): SportRules | null {
    return this.strategies.get(`${sportCode}_${modality}`) ?? null;
  }

  list(): readonly SportRules[] {
    return Array.from(this.strategies.values());
  }
}
