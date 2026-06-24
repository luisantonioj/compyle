import type { UserData } from '../types';

export type DataSetter = (updater: (data: UserData) => UserData) => void;

