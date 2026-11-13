import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignUpRequest } from './sign-up.request';
import { SignUpResponse } from './sign-up-response';
import { User } from '../domain/model/user.entity';
import { mapBackendUserToEntity, splitFullName } from './user-mapper.util';

export class SignUpAssembler {
  static toRequestFromCommand(command: SignUpCommand): SignUpRequest {
    const { firstName, lastName } = splitFullName(command.name);
    return {
      email: command.email.trim().toLowerCase(),
      password: command.password,
      firstName,
      lastName
    };
  }

  static toEntityFromResponse(response: SignUpResponse): User {
    return mapBackendUserToEntity(response);
  }
}
