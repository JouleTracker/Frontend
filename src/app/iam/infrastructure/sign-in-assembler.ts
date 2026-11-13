import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInRequest } from './sign-in.request';
import { SignInResponse } from './sign-in-response';
import { User } from '../domain/model/user.entity';
import { mapBackendUserToEntity } from './user-mapper.util';

export class SignInAssembler {
  static toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {
      email: command.email.trim().toLowerCase(),
      password: command.password
    };
  }

  static toEntityFromResponse(response: SignInResponse): User {
    if (response.user) {
      return mapBackendUserToEntity(
        response.user,
        undefined,
        response.token
      );
    }

    return mapBackendUserToEntity(
      {
        id: response.id ?? 0,
        email: response.email ?? '',
        firstName: response.firstName,
        lastName: response.lastName,
        name: response.name,
        roles: response.roles,
        role: response.role,
        emailVerified: response.emailVerified,
        verified: response.verified,
        banned: response.banned,
        plan: response.plan,
        phone: response.phone,
        home: response.home,
        business: response.business,
        notifications: response.notifications
      },
      undefined,
      response.token
    );
  }
}
