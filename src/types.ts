import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import UserService from './services/base/user-service';

export type ApolloContext = {
    services: { userService: UserService }
    req: Request,
    res: Response,
    redis: Redis,
}

export interface UserRequest extends Request{
    service?: UserService;
}