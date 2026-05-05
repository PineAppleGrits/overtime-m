import { INotificationContextPort } from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { RegistrationApprovedListener } from './registration-approved.listener';

const makeContext = (): jest.Mocked<INotificationContextPort> =>
  ({
    findRegistration: jest.fn(),
    findMatch: jest.fn(),
    findFriendly: jest.fn(),
    findDebt: jest.fn(),
    findPayment: jest.fn(),
    findSanction: jest.fn(),
    findProfile: jest.fn(),
    findAdminsWithEmail: jest.fn(),
  }) as unknown as jest.Mocked<INotificationContextPort>;

const makeNotifications = (): jest.Mocked<NotificationsService> =>
  ({
    send: jest.fn().mockResolvedValue({ success: true, id: 'mock' }),
  }) as unknown as jest.Mocked<NotificationsService>;

describe('RegistrationApprovedListener (RN-013)', () => {
  it('envía email al captain del equipo cuando hay email', async () => {
    const context = makeContext();
    const notifications = makeNotifications();
    context.findRegistration.mockResolvedValueOnce({
      id: 'reg-1',
      team: {
        id: 't-1',
        name: 'Lakers',
        captain: { id: 'cap-1', email: 'cap@x.com', name: 'Captain' },
      },
      tournamentName: 'Apertura 2026',
      categoryName: 'A',
      rejectionReason: null,
      requester: null,
    });

    const listener = new RegistrationApprovedListener(context, notifications);
    await listener.handle({
      registrationId: 'reg-1',
      teamId: 't-1',
      tournamentId: 'tourn-1',
      approvedBy: 'admin-1',
    });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    const arg = notifications.send.mock.calls[0][0];
    expect(arg.to).toBe('cap@x.com');
    expect(arg.rendered.subject).toContain('Lakers');
  });

  it('cae al requester si no hay captain', async () => {
    const context = makeContext();
    const notifications = makeNotifications();
    context.findRegistration.mockResolvedValueOnce({
      id: 'reg-1',
      team: { id: 't-1', name: 'Bulls', captain: null },
      tournamentName: 'Clausura',
      categoryName: null,
      rejectionReason: null,
      requester: {
        id: 'req-1',
        email: 'req@x.com',
        name: 'Requester',
      },
    });

    const listener = new RegistrationApprovedListener(context, notifications);
    await listener.handle({
      registrationId: 'reg-1',
      teamId: 't-1',
      tournamentId: 'tourn-1',
      approvedBy: 'admin-1',
    });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(notifications.send.mock.calls[0][0].to).toBe('req@x.com');
  });

  it('no envía si no hay email en absoluto', async () => {
    const context = makeContext();
    const notifications = makeNotifications();
    context.findRegistration.mockResolvedValueOnce({
      id: 'reg-1',
      team: { id: 't-1', name: 'Bulls', captain: null },
      tournamentName: 'Clausura',
      categoryName: null,
      rejectionReason: null,
      requester: null,
    });

    const listener = new RegistrationApprovedListener(context, notifications);
    await listener.handle({
      registrationId: 'reg-1',
      teamId: 't-1',
      tournamentId: 'tourn-1',
      approvedBy: 'admin-1',
    });

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('skip silencioso si registration no existe', async () => {
    const context = makeContext();
    const notifications = makeNotifications();
    context.findRegistration.mockResolvedValueOnce(null);

    const listener = new RegistrationApprovedListener(context, notifications);
    await listener.handle({
      registrationId: 'reg-x',
      teamId: 't',
      tournamentId: 't',
      approvedBy: 'a',
    });

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('no propaga errores del context', async () => {
    const context = makeContext();
    const notifications = makeNotifications();
    context.findRegistration.mockRejectedValueOnce(new Error('boom'));

    const listener = new RegistrationApprovedListener(context, notifications);
    await expect(
      listener.handle({
        registrationId: 'reg-1',
        teamId: 't',
        tournamentId: 't',
        approvedBy: 'a',
      }),
    ).resolves.toBeUndefined();
  });
});
