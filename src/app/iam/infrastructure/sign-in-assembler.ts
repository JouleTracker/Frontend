// src/app/iam/infrastructure/sign-in-assembler.ts
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInRequest } from './sign-in.request';
import { SignInResponse } from './sign-in-response';
import { User } from '../domain/model/user.entity';

export class SignInAssembler {
  static toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {
      email: command.email,
      password: command.password
    };
  }

  static toEntityFromResponse(response: SignInResponse): User {
    if (response.user) {
      return response.user;
    }
    return {
      id: response.id,
      name: response.name,
      email: response.email,
      role: response.role,
      token: response.token ?? `mock-token-${response.id}`
    };
  }
}
