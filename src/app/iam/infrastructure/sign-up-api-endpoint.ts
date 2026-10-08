import { environment } from '../../../environments/environment';


export class SignUpApiEndpoint {
  static getEndpoint(): string {
    return `${environment.apiBaseUrl}${environment.usersEndpointPath}`;
  }
}
