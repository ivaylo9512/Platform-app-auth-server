import './utils/load-env'
import 'reflect-metadata';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import UserResolver from './resolvers/User';
import cors from 'cors';
import Redis from 'ioredis';
import UserServiceImpl from './services/user-service-impl';
import { UserRequest } from './types';
import userRouter from './routers/user-routes';
import cookieParser from 'cookie-parser';

const main = async () => {
    const orm = await MikroORM.init(mikroConfig)
    await orm.getMigrator().up();
    
    const redis = new Redis();
    const userService = new UserServiceImpl(orm.em, redis);

    const app = express();
    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
    }))

    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use((req, res, next) => {
        RequestContext.create(orm.em, next);
    });

    app.use('/users', (req: UserRequest, res, next) => {
        req.service = userService
        next();
    }, userRouter);

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver],
            validate: false
        }),
        context: ({req, res}) => ({ services: { userService }, req, res }) 
    })

    apolloServer.applyMiddleware({ app });

    const PORT = process.env.PORT || 8056;
    app.listen(PORT, () => {
        console.log(`\n🚀!! server started on http://localhost:${PORT} !!`)
    })
}
main().catch(err => console.log(err));