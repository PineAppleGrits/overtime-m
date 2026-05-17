import { INotificationContextPort } from '../../application/ports/notification-context.port';
import { NotificationsService } from '../../application/services/notifications.service';
import { ProfileRoleChangedListener } from './profile-role-changed.listener';

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

describe('ProfileRoleChangedListener', () => {
  it('envía email al perfil cuando tiene email', async () => {
    const context = makeContext();
    const notifications = makeNotifications();
    context.findProfile.mockResolvedValueOnce({
      id: 'prof-1',
      email: 'user@test.com',
      name: 'Usuario Test',
    });

    const listener = new ProfileRoleChangedListener(context, notifications);
    await listener.handle({
      profileId: 'prof-1',
      fromRole: 'player',
      toRole: 'referee',
      changedBy: 'admin-1',
    });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    const arg = notifications.send.mock.calls[0][0];
    expect(arg.to).toBe('user@test.com');
    expect(arg.rendered.subject).toContain('referee');
  });

  it('no envía si el perfil no tiene email', async () => {
    const context = makeContext();
    const notifications = makeNotifications();
    context.findProfile.mockResolvedValueOnce({
      id: 'prof-1',
      email: null,
      name: 'Usuario Test',
    });

    const listener = new ProfileRoleChangedListener(context, notifications);
    await listener.handle({
      profileId: 'prof-1',
      fromRole: 'player',
      toRole: 'referee',
      changedBy: 'admin-1',
    });

    expect(notifications.send).not.toHaveBeenCalled();
  });
});
