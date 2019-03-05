import { Timer } from './timer.entity';

export const timerProviders = [
  {
    provide: 'TimerRepository',
    useValue: Timer,
  },
];
