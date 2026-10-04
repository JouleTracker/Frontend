import { environment } from '../../../environments/environment';

/**
 * Base configuration and helper for API endpoints.
 */
export abstract class BaseApi {
  protected readonly baseUrl: string = environment.apiBaseUrl;
}
