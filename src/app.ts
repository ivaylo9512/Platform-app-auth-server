import './utils/load-env'
import 'reflect-metadata';
import 'passport';
import { MikroORM, RequestContext, DateType } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express, { ErrorRequestHandler } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema} from 'type-graphql';
import { applyMiddleware } from 'graphql-middleware';
import UserResolver from './resolvers/user-resolver';
import cors from 'cors';
import Redis from 'ioredis';
import UserServiceImpl from './services/user-service-impl';
import userRouter from './routers/user-routes';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './authentication/authenticate';
import User from './entities/user-entity';
import RefreshTokenServiceImpl from './services/refresh-token-service-impl';
import RefreshToken from './entities/refresh-token';
import { registerMiddleware, createManyMiddleware, updateManyMiddleware } from './resolvers/middlewares/user-validators';
import authResolverMiddleware from './resolvers/middlewares/auth';
import { DateTypeScalar } from './scalars/date-time';

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
    
    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use((_req, _res, next) => {
        RequestContext.create(orm.em, next);
    });

    authMiddleware(app, userService);

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
            scalarsMap: [{ type: DateType, scalar: DateTypeScalar }],
            validate: false
        }), authResolverMiddleware, registerMiddleware, createManyMiddleware, updateManyMiddleware),
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