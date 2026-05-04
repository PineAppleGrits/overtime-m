import { PrismaService } from '../../../database/prisma.service';
import { HandleDepositPaidUseCase } from '../../application/use-cases/handle-deposit-paid.use-case';
import { MarkFriendlyPlayedUseCase } from '../../application/use-cases/mark-played.use-case';
import { FriendliesEventListener } from './payment-approved.listener';

describe('FriendliesEventListener', () => {
  const makeListener = (overrides?: {
    matchType?: string;
    resultingFriendly?: { id: string } | null;
    matchExists?: boolean;
  }) => {
    const handleDepositPaid = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as HandleDepositPaidUseCase;
    const markPlayed = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as MarkFriendlyPlayedUseCase;
    const prisma = {
      match: {
        findUnique: jest.fn().mockResolvedValue(
          overrides?.matchExists === false
            ? null
            : {
                matchType: overrides?.matchType ?? 'amistoso',
                resultingFriendly:
                  overrides?.resultingFriendly === undefined
                    ? { id: 'f-1' }
                    : overrides.resultingFriendly,
              },
        ),
      },
    } as unknown as PrismaService;
    const listener = new FriendliesEventListener(
      handleDepositPaid,
      markPlayed,
      prisma,
    );
    return { listener, handleDepositPaid, markPlayed, prisma };
  };

  it('payment.approved con debtId dispara HandleDepositPaidUseCase', async () => {
    const { listener, handleDepositPaid } = makeListener();
    await listener.onPaymentApproved({
      paymentId: 'pay-1',
      debtId: 'debt-1',
      approvedBy: 'admin-1',
      method: 'mercadopago',
    });
    expect(handleDepositPaid.execute).toHaveBeenCalledWith({
      debtId: 'debt-1',
    });
  });

  it('payment.approved sin debtId no dispara nada', async () => {
    const { listener, handleDepositPaid } = makeListener();
    await listener.onPaymentApproved({
      paymentId: 'pay-1',
      approvedBy: 'admin-1',
      method: 'mercadopago',
    });
    expect(handleDepositPaid.execute).not.toHaveBeenCalled();
  });

  it('errores en HandleDepositPaid no propagan al bus de eventos', async () => {
    const { listener, handleDepositPaid } = makeListener();
    (handleDepositPaid.execute as jest.Mock).mockRejectedValueOnce(
      new Error('boom'),
    );
    await expect(
      listener.onPaymentApproved({
        paymentId: 'pay-1',
        debtId: 'debt-1',
        approvedBy: 'admin-1',
        method: 'mercadopago',
      }),
    ).resolves.toBeUndefined();
  });

  it('match.finished con matchType=amistoso marca el friendly como PLAYED', async () => {
    const { listener, markPlayed } = makeListener();
    await listener.onMatchFinished({
      matchId: 'm-1',
      homeScore: 80,
      awayScore: 70,
      homeTeamId: 'team-A',
      awayTeamId: 'team-B',
      countsForStandings: true,
    });
    expect(markPlayed.execute).toHaveBeenCalledWith({ friendlyId: 'f-1' });
  });

  it('match.finished con matchType=regular no toca el module Friendlies', async () => {
    const { listener, markPlayed } = makeListener({ matchType: 'regular' });
    await listener.onMatchFinished({
      matchId: 'm-1',
      homeScore: 80,
      awayScore: 70,
      homeTeamId: 'team-A',
      awayTeamId: 'team-B',
      countsForStandings: true,
    });
    expect(markPlayed.execute).not.toHaveBeenCalled();
  });

  it('match.finished sin friendly resultante no llama markPlayed', async () => {
    const { listener, markPlayed } = makeListener({
      resultingFriendly: null,
    });
    await listener.onMatchFinished({
      matchId: 'm-1',
      homeScore: 80,
      awayScore: 70,
      homeTeamId: 'team-A',
      awayTeamId: 'team-B',
      countsForStandings: true,
    });
    expect(markPlayed.execute).not.toHaveBeenCalled();
  });
});
