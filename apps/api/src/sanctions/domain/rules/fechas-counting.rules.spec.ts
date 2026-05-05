import {
  addFechasCumplidas,
  hasPendingFechas,
  readFechasState,
  writeFechasState,
} from './fechas-counting.rules';

describe('fechas-counting.rules', () => {
  describe('readFechasState', () => {
    it('null cuando no hay marcador', () => {
      expect(readFechasState(null)).toBeNull();
      expect(readFechasState('foo bar')).toBeNull();
    });

    it('parsea total y cumplidas', () => {
      const parsed = readFechasState(
        'antecedente cualquiera\n[FECHAS] total=5 cumplidas=2',
      );
      expect(parsed).toEqual({ totalFechas: 5, fechasCumplidas: 2 });
    });
  });

  describe('writeFechasState', () => {
    it('agrega marcador en notes vacía', () => {
      expect(writeFechasState(null, { totalFechas: 3, fechasCumplidas: 0 })).toBe(
        '[FECHAS] total=3 cumplidas=0',
      );
    });

    it('reemplaza el marcador existente sin tocar el resto', () => {
      const out = writeFechasState(
        'nota previa\n[FECHAS] total=3 cumplidas=0\nmás texto',
        { totalFechas: 3, fechasCumplidas: 1 },
      );
      expect(out).toContain('[FECHAS] total=3 cumplidas=1');
      expect(out).toContain('nota previa');
      expect(out).toContain('más texto');
    });

    it('agrega marcador al final cuando no existía', () => {
      const out = writeFechasState('previo', {
        totalFechas: 4,
        fechasCumplidas: 1,
      });
      expect(out).toBe('previo\n[FECHAS] total=4 cumplidas=1');
    });
  });

  describe('addFechasCumplidas', () => {
    it('suma sin pasarse del total', () => {
      const out = addFechasCumplidas(
        { totalFechas: 5, fechasCumplidas: 3 },
        2,
      );
      expect(out.next).toEqual({ totalFechas: 5, fechasCumplidas: 5 });
      expect(out.autoResolved).toBe(true);
    });

    it('clampea si el delta supera el restante', () => {
      const out = addFechasCumplidas(
        { totalFechas: 5, fechasCumplidas: 4 },
        10,
      );
      expect(out.next.fechasCumplidas).toBe(5);
      expect(out.autoResolved).toBe(true);
    });

    it('autoResolved=false cuando aún quedan fechas', () => {
      const out = addFechasCumplidas(
        { totalFechas: 5, fechasCumplidas: 1 },
        2,
      );
      expect(out.next.fechasCumplidas).toBe(3);
      expect(out.autoResolved).toBe(false);
    });
  });

  describe('hasPendingFechas', () => {
    it('false cuando state es null', () => {
      expect(hasPendingFechas(null)).toBe(false);
    });

    it('true cuando aún quedan', () => {
      expect(hasPendingFechas({ totalFechas: 3, fechasCumplidas: 1 })).toBe(true);
    });

    it('false cuando ya cumplió', () => {
      expect(hasPendingFechas({ totalFechas: 3, fechasCumplidas: 3 })).toBe(false);
    });
  });
});
