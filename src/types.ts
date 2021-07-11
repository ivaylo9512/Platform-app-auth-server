import { Request, Response } from 'express';
import UserService from './services/base/user-service';

export type ApolloContext = {
    services: { userService: UserService }
    req: Request,
    res: Response,
}

export interface UserRequest extends Request{
    service?: UserService;
}