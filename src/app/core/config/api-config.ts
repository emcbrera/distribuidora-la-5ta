import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  readonly dispatchUrl: string;
  readonly movementsUrl: string;
  readonly timeoutMs: number;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

export const apiConfig: ApiConfig = {
  dispatchUrl: 'https://hook.eu1.make.com/h7liac5fg4bfymqk6olwl9uc3k8uksix',
  movementsUrl: '',
  timeoutMs: 30000,
};
