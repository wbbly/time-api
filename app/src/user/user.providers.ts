import { User } from './user.entity';

export const userProviders = [
  {
    provide: 'UserRepository',
    useValue: User,
  },
];
