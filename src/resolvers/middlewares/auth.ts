import { IMiddlewareFunction } from "graphql-middleware";
import UnauthorizedException from "../../exceptions/unauthorized";
import { Request } from 'express';
import { verify } from "jsonwebtoken";
import { jwtSecret } from "../../authentication/jwt";

type AuthMiddleware = {
    [name: string]: {
        [name: string]: IMiddlewareFunction
    }
}

const authenticate = (async (resolve, parent, args, context, info) => {
    const req = context.req;

    req.foundUser = await getUserFromToken(req)
 
    return await resolve(parent, args, context, info)
}) as IMiddlewareFunction

const authMiddleware: AuthMiddleware = {
    Mutation: {
        createMany: authenticate,
        update: authenticate,
        delete: authenticate,
    },
    Query: {
        userById: authenticate,
    }
}

const getUserFromToken = async (req: Request) => {
    let token = req.headers?.authorization;
    if(!token){
        throw new UnauthorizedException('No auth token');
    }
    token = token.split(' ')[1];

    return await req.userService.verifyLoggedUser(verify(token, jwtSecret).id);
}

export default authMiddleware