import 'reflect-metadata';
import { TournamentStatus } from '@overtime-mono/shared';
import {
  isTerminalStatus,
  isValidStatusTransition,
  listAllowedTransitions,
} from './status-transitions.rules';

describe('status-transitions.rules', () => {
  describe('isValidStatusTransition (camino feliz)', () => {
    const happyPath: Array<[TournamentStatus, TournamentStatus]> = [
      [TournamentStatus.DRAFT, TournamentStatus.OPEN],
      [TournamentStatus.OPEN, TournamentStatus.CLOSED],
      [TournamentStatus.CLOSED, TournamentStatus.READY_TO_SHIP],
      [TournamentStatus.READY_TO_SHIP, TournamentStatus.IN_PROGRESS],
      [TournamentStatus.IN_PROGRESS, TournamentStatus.FINISHED],
      [TournamentStatus.FINISHED, TournamentStatus.ARCHIVED],
    ];

    it.each(happyPath)('permite %s → %s', (from, to) => {
      expect(isValidStatusTransition(from, to)).toBe(true);
    });
  });

  describe('CANCELLED', () => {
    it('se permite desde DRAFT, OPEN, CLOSED, READY_TO_SHIP e IN_PROGRESS', () => {
      const allowed: TournamentStatus[] = [
        TournamentStatus.DRAFT,
        TournamentStatus.OPEN,
        TournamentStatus.CLOSED,
        TournamentStatus.READY_TO_SHIP,
        TournamentStatus.IN_PROGRESS,
      ];
      for (const from of allowed) {
        expect(isValidStatusTransition(from, TournamentStatus.CANCELLED)).toBe(
          true,
        );
      }
    });

    it('NO se permite desde FINISHED ni ARCHIVED', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.FINISHED,
          TournamentStatus.CANCELLED,
        ),
      ).toBe(false);
      expect(
        isValidStatusTransition(
          TournamentStatus.ARCHIVED,
          TournamentStatus.CANCELLED,
        ),
      ).toBe(false);
    });
  });

  describe('saltos inválidos', () => {
    it('rechaza DRAFT → IN_PROGRESS', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.DRAFT,
          TournamentStatus.IN_PROGRESS,
        ),
      ).toBe(false);
    });

    it('rechaza OPEN → FINISHED', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.OPEN,
          TournamentStatus.FINISHED,
        ),
      ).toBe(false);
    });

    it('rechaza FINISHED → IN_PROGRESS', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.FINISHED,
          TournamentStatus.IN_PROGRESS,
        ),
      ).toBe(false);
    });

    it('rechaza retroceder a DRAFT desde cualquier otro estado', () => {
      const others: TournamentStatus[] = [
        TournamentStatus.OPEN,
        TournamentStatus.CLOSED,
        TournamentStatus.READY_TO_SHIP,
        TournamentStatus.IN_PROGRESS,
        TournamentStatus.FINISHED,
      ];
      for (const from of others) {
        expect(isValidStatusTransition(from, TournamentStatus.DRAFT)).toBe(
          false,
        );
      }
    });

    it('rechaza transiciones a sí mismo (no-op)', () => {
      expect(
        isValidStatusTransition(TournamentStatus.OPEN, TournamentStatus.OPEN),
      ).toBe(false);
    });
  });

  describe('estados terminales', () => {
    it('ARCHIVED no tiene transiciones', () => {
      expect(listAllowedTransitions(TournamentStatus.ARCHIVED)).toEqual([]);
      expect(isTerminalStatus(TournamentStatus.ARCHIVED)).toBe(true);
    });

    it('CANCELLED no tiene transiciones', () => {
      expect(listAllowedTransitions(TournamentStatus.CANCELLED)).toEqual([]);
      expect(isTerminalStatus(TournamentStatus.CANCELLED)).toBe(true);
    });

    it('FINISHED es terminal salvo ARCHIVED', () => {
      expect(listAllowedTransitions(TournamentStatus.FINISHED)).toEqual([
        TournamentStatus.ARCHIVED,
      ]);
      expect(isTerminalStatus(TournamentStatus.FINISHED)).toBe(true);
    });
  });
});
