import { environment } from '../../../environments/environment';

export class SignInApiEndpoint {
  static getEndpoint(): string {
    return `${environment.apiBaseUrl}${environment.usersEndpointPath}`;
  }
}
