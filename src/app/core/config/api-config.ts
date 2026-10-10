import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  readonly dispatchUrl: string;
  readonly movementsUrl: string;
  readonly timeoutMs: number;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

export const apiConfig: ApiConfig = {
  dispatchUrl: 'https://hook.eu1.make.com/i8eqrd7i9cpjyg8mrrbkldnclg318ee5',
  movementsUrl: '',
  timeoutMs: 30000,
};
