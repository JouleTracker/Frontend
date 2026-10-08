import { User } from '../domain/model/user.entity';

export interface SignInResponse {
  id: number;
  name: string;
  email: string;
  token?: string;
  role?: string;
  user?: User;
}
