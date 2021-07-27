import { IMiddlewareFunction } from "graphql-middleware";
import UnauthorizedException from "../../expceptions/unauthorized";
import { Request } from 'express';
import { verify } from "jsonwebtoken";
import { jwtSecret } from "src/authentication/jwt";

type AuthMiddleware = {
    [name: string]: {
        [name: string]: IMiddlewareFunction
    }
}
const authMiddleware: AuthMiddleware = {
    Mutation: {
        createMany: async (resolve, parent, args, context, info) => {
            const { req, res } = context;

            req.user = await getUserFromToken(req)
            return await resolve(parent, args, context, info)
        },
        update: async (resolve, parent, args, context, info) => {
            const { req, res } = context;

            req.user = await getUserFromToken(req)

            return await resolve(parent, args, context, info)
        },
    },
}

const getUserFromToken = async (req: Request) => {
    let token = req.headers?.authorization;
    if(!token){
        throw new UnauthorizedException('Unauthorized');
    }
    token = token.split(' ')[1];

    return await req.userService.verifyLoggedUser(verify(token, jwtSecret).id);
}

export default authMiddleware