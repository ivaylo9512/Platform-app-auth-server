import { Request, Response } from 'express';
import UserService from './services/base/user-service';
import { JwtUser } from './authentication/jwt-user';
import UserRouter from './routers/user-routes'
export type ApolloContext = {
    services: { userService: UserService }
    req: Request,
    res: Response,
}

export interface UserRequest extends Request{
    service?: UserService;
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
      interface User extends JwtUser{

      }
    }
}