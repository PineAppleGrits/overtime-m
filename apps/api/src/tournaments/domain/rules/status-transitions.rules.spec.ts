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
      [TournamentStatus.DRAFT, TournamentStatus.PUBLISHED],
      [TournamentStatus.PUBLISHED, TournamentStatus.INSCRIPTION_OPEN],
      [TournamentStatus.INSCRIPTION_OPEN, TournamentStatus.INSCRIPTION_CLOSED],
      [TournamentStatus.INSCRIPTION_CLOSED, TournamentStatus.IN_PROGRESS],
      [TournamentStatus.IN_PROGRESS, TournamentStatus.PLAYING],
      [TournamentStatus.PLAYING, TournamentStatus.FINISHED],
      [TournamentStatus.FINISHED, TournamentStatus.ARCHIVED],
    ];

    it.each(happyPath)('permite %s → %s', (from, to) => {
      expect(isValidStatusTransition(from, to)).toBe(true);
    });
  });

  describe('ARCHIVED', () => {
    it('se permite desde cualquier estado no terminal', () => {
      const allowed: TournamentStatus[] = [
        TournamentStatus.DRAFT,
        TournamentStatus.PUBLISHED,
        TournamentStatus.INSCRIPTION_OPEN,
        TournamentStatus.INSCRIPTION_CLOSED,
        TournamentStatus.IN_PROGRESS,
        TournamentStatus.PLAYING,
        TournamentStatus.FINISHED,
      ];
      for (const from of allowed) {
        expect(isValidStatusTransition(from, TournamentStatus.ARCHIVED)).toBe(
          true,
        );
      }
    });

    it('NO se permite desde ARCHIVED (terminal)', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.ARCHIVED,
          TournamentStatus.FINISHED,
        ),
      ).toBe(false);
    });
  });

  describe('rollbacks permitidos', () => {
    it('PUBLISHED → DRAFT', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.PUBLISHED,
          TournamentStatus.DRAFT,
        ),
      ).toBe(true);
    });

    it('INSCRIPTION_CLOSED → INSCRIPTION_OPEN (reabrir)', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.INSCRIPTION_CLOSED,
          TournamentStatus.INSCRIPTION_OPEN,
        ),
      ).toBe(true);
    });

    it('IN_PROGRESS → INSCRIPTION_CLOSED', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.IN_PROGRESS,
          TournamentStatus.INSCRIPTION_CLOSED,
        ),
      ).toBe(true);
    });
  });

  describe('saltos inválidos', () => {
    it('rechaza DRAFT → INSCRIPTION_OPEN', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.DRAFT,
          TournamentStatus.INSCRIPTION_OPEN,
        ),
      ).toBe(false);
    });

    it('rechaza INSCRIPTION_OPEN → FINISHED', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.INSCRIPTION_OPEN,
          TournamentStatus.FINISHED,
        ),
      ).toBe(false);
    });

    it('rechaza FINISHED → PLAYING', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.FINISHED,
          TournamentStatus.PLAYING,
        ),
      ).toBe(false);
    });

    it('rechaza transiciones a sí mismo (no-op)', () => {
      expect(
        isValidStatusTransition(
          TournamentStatus.INSCRIPTION_OPEN,
          TournamentStatus.INSCRIPTION_OPEN,
        ),
      ).toBe(false);
    });
  });

  describe('estados terminales', () => {
    it('ARCHIVED no tiene transiciones', () => {
      expect(listAllowedTransitions(TournamentStatus.ARCHIVED)).toEqual([]);
      expect(isTerminalStatus(TournamentStatus.ARCHIVED)).toBe(true);
    });

    it('FINISHED sólo permite ARCHIVED', () => {
      expect(listAllowedTransitions(TournamentStatus.FINISHED)).toEqual([
        TournamentStatus.ARCHIVED,
      ]);
      expect(isTerminalStatus(TournamentStatus.FINISHED)).toBe(false);
    });
  });
});
