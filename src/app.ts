import './utils/load-env'
import 'reflect-metadata';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express, { ErrorRequestHandler } from 'express';
import { ApolloServer, UserInputError } from 'apollo-server-express';
import { buildSchema} from 'type-graphql';
import { applyMiddleware, IMiddlewareFunction } from 'graphql-middleware';
import UserResolver from './resolvers/User';
import cors from 'cors';
import Redis from 'ioredis';
import UserServiceImpl from './services/user-service-impl';
import userRouter from './routers/user-routes';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './authentication/authenticate';
import User from './entities/user';
import RefreshTokenServiceImpl from './services/refresh-token-service-impl';
import RefreshToken from './entities/refresh-token';
import { registerResolverValidator, updateResolverValidator, createResolverValidator } from './validators/users-validator';
export const NODE_ENV = process.env.NODE_ENV;

export const initialize = async () => {
    const orm = await MikroORM.init(mikroConfig)

    if(NODE_ENV === 'test'){
        await orm.getSchemaGenerator().dropSchema(true, true);
    }
    await orm.getMigrator().up();

    const redis = new Redis();
    const userService = new UserServiceImpl(orm.em.getRepository(User), redis);
    const refreshTokenService = new RefreshTokenServiceImpl(orm.em.getRepository(RefreshToken));

    const app = express();
    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
    }))

    authMiddleware(app);

    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const registerMiddleware = {
        Mutation: {
            register: (async (resolve, parent, args, context, info) => {
                const { req, res } = context;
                req.body = args.registerInput;

                const errors = await registerResolverValidator(req);
                if(errors){
                    res.status(422);
                    throw new UserInputError('Register error.', errors)
                }

                return await resolve(parent, args, context, info)
            }) as IMiddlewareFunction,
        },
      }

      const createManyMiddleware = {
        Mutation: {
            createMany: (async (resolve, parent, args, context, info) => {
                const { req, res } = context;
                req.body = args;

                const errors = await createResolverValidator(req);
                if(errors){
                    throw new UserInputError('Create many error.', errors)
                }

                return await resolve(parent, args, context, info)
          }) as IMiddlewareFunction,
        },
    }

    const updateManyMiddleware = {
        Mutation: {
            update: (async (resolve, parent, args, context, info) => {
                const { req, res } = context;
                req.body = args.updateInput;

                const errors = await updateResolverValidator(req);
                if(errors){
                    throw new UserInputError('Update error.', errors)
                }

                return await resolve(parent, args, context, info)
          }) as IMiddlewareFunction,
        },
    }
    
    app.use((_req, _res, next) => {
        RequestContext.create(orm.em, next);
    });

    app.use('/users', (req, _res, next) => {
        req.userService = userService
        req.refreshTokenService = refreshTokenService;
        next();
    }, userRouter);

    app.use(((err, _req, res, _next) => {
        res.status(err.status || 500).send(err.message);
    }) as ErrorRequestHandler)

    const server = new ApolloServer({
        schema: applyMiddleware(await buildSchema({
            resolvers: [UserResolver],
        }), registerMiddleware, createManyMiddleware, updateManyMiddleware),
        context: ({req, res}) => {
            req.userService = userService;
            req.refreshTokenService = refreshTokenService;

            return {req, res} 
        } 
    })

    server.applyMiddleware({ app });

    return {
        app, 
        orm,
        redis
    };
}