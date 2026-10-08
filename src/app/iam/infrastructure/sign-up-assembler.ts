// src/app/iam/infrastructure/sign-up-assembler.ts
import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignUpRequest } from './sign-up.request';
import { SignUpResponse } from './sign-up-response';
import { User } from '../domain/model/user.entity';

export class SignUpAssembler {
  static toRequestFromCommand(command: SignUpCommand): SignUpRequest {
    return {
      name: command.name,
      email: command.email,
      password: command.password,
      role: command.role || 'homeowner'
    };
  }

  static toEntityFromResponse(response: SignUpResponse): User {
    return {
      id: response.id,
      name: response.name,
      email: response.email,
      role: response.role
    };
  }
}
