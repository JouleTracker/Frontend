import { BackendUserResource } from './user-mapper.util';

export interface SignInResponse extends Partial<BackendUserResource> {
  token?: string;
  tokenType?: string;
  user?: BackendUserResource;
}
