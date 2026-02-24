import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from './roles.decorator';

export const Admin = () => SetMetadata(ROLES_KEY, ['admin', 'master']);
