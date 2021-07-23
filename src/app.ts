import './utils/load-env'
import 'reflect-metadata';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express, { ErrorRequestHandler } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import UserResolver from './resolvers/User';
import cors from 'cors';
import Redis from 'ioredis';
import UserServiceImpl from './services/user-service-impl';
import { UserRequest } from './types';
import userRouter from './routers/user-routes';
import cookieParser from 'cookie-parser';
import { verifyMiddleware } from './authentication/authenticate';

export const NODE_ENV = process.env.NODE_ENV;
export const initialize = async () => {
    const orm = await MikroORM.init(mikroConfig)
    
    if(NODE_ENV === 'test'){
        await orm.getSchemaGenerator().dropSchema(undefined, true);
    }
    await orm.getMigrator().up();

    const redis = new Redis();
    const userService = new UserServiceImpl(orm.em, redis);

    const app = express();
    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
    }))

    verifyMiddleware(app);

    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use((_req, _res, next) => {
        RequestContext.create(orm.em, next);
    });

    app.use('/users', (req: UserRequest, _res, next) => {
        req.service = userService
        next();
    }, userRouter);

    app.use(((err, _req, res, next) => {
        res.status(err.status).send(err.message);
    }) as ErrorRequestHandler)

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver],
            validate: false
        }),
        context: ({req, res}) => ({ services: { userService }, req, res }) 
    })

    apolloServer.applyMiddleware({ app });

    return app;
}