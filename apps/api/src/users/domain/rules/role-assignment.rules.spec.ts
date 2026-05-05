import { ProfileRole } from '@prisma/client';
import {
  assertCanAssignRole,
  assertCanTouchTarget,
  canActorAssignRole,
  canActorTouchTarget,
  isValidProfileRole,
  RoleAssignmentForbiddenError,
} from './role-assignment.rules';

describe('role-assignment.rules', () => {
  describe('isValidProfileRole', () => {
    it('acepta roles del enum Prisma', () => {
      expect(isValidProfileRole('player')).toBe(true);
      expect(isValidProfileRole('admin')).toBe(true);
      expect(isValidProfileRole('master')).toBe(true);
    });
    it('rechaza valores arbitrarios', () => {
      expect(isValidProfileRole('superadmin')).toBe(false);
      expect(isValidProfileRole('')).toBe(false);
    });
  });

  describe('canActorAssignRole', () => {
    it('master puede asignar admin/player/referee/etc', () => {
      expect(canActorAssignRole('master', ProfileRole.admin)).toBe(true);
      expect(canActorAssignRole('master', ProfileRole.player)).toBe(true);
      expect(canActorAssignRole('master', ProfileRole.referee)).toBe(true);
    });
    it('master NO puede asignar master', () => {
      expect(canActorAssignRole('master', ProfileRole.master)).toBe(false);
    });
    it('admin puede asignar player/referee/official/photographer', () => {
      expect(canActorAssignRole('admin', ProfileRole.player)).toBe(true);
      expect(canActorAssignRole('admin', ProfileRole.referee)).toBe(true);
      expect(canActorAssignRole('admin', ProfileRole.official)).toBe(true);
      expect(canActorAssignRole('admin', ProfileRole.photographer)).toBe(true);
    });
    it('admin NO puede asignar admin ni master', () => {
      expect(canActorAssignRole('admin', ProfileRole.admin)).toBe(false);
      expect(canActorAssignRole('admin', ProfileRole.master)).toBe(false);
    });
    it('player NO puede asignar nada', () => {
      expect(canActorAssignRole('player', ProfileRole.player)).toBe(false);
    });
  });

  describe('canActorTouchTarget', () => {
    it('master toca a cualquiera', () => {
      expect(canActorTouchTarget('master', ProfileRole.admin)).toBe(true);
      expect(canActorTouchTarget('master', ProfileRole.master)).toBe(true);
    });
    it('admin no puede tocar admins/masters', () => {
      expect(canActorTouchTarget('admin', ProfileRole.master)).toBe(false);
      expect(canActorTouchTarget('admin', ProfileRole.admin)).toBe(false);
      expect(canActorTouchTarget('admin', ProfileRole.player)).toBe(true);
    });
  });

  describe('assertCanAssignRole', () => {
    it('throws cuando no puede', () => {
      expect(() =>
        assertCanAssignRole('admin', ProfileRole.master),
      ).toThrow(RoleAssignmentForbiddenError);
    });
    it('no throws cuando sí puede', () => {
      expect(() =>
        assertCanAssignRole('admin', ProfileRole.player),
      ).not.toThrow();
    });
  });

  describe('assertCanTouchTarget', () => {
    it('throws cuando no puede', () => {
      expect(() =>
        assertCanTouchTarget('admin', ProfileRole.master),
      ).toThrow(RoleAssignmentForbiddenError);
    });
  });
});
