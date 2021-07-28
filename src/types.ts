import { Request, Response } from 'express';
import UserService from './services/base/user-service';
import RefreshTokenService from './services/base/refresh-token-service';
import UserEntity from './entities/user';
import { JwtUser } from './authentication/jwt-user';

export type ApolloContext = {
    req: Request,
    res: Response,
}

declare module 'jsonwebtoken' {
    function verify(token: string, secretOrPublicKey: Secret, options?: VerifyOptions): JwtUser;
}

declare global {
    namespace Express {
      interface User extends JwtUser{
      }
    }
}
declare global {
    namespace Express {
      interface Request{
        userService: UserService;
        foundUser?: UserEntity;   
        refreshTokenService: RefreshTokenService
      }
    }
}