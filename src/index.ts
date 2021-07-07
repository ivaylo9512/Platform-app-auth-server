import { MikroORM } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import UserResolver from './resolvers/User';
import cors from 'cors';
import Redis from 'ioredis';

const main = async () => {
    const orm = await MikroORM.init(mikroConfig)
    await orm.getMigrator().up();

    const app = express();
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }))

    const redis = new Redis();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver],
            validate: false
        }),
        context: ({req, res}) => ({ em: orm.em, req, res, redis }) 
    })

    apolloServer.applyMiddleware({ app });

    const PORT = process.env.PORT || 8056;
    app.listen(PORT, () => {
        console.log(`\n🚀!! server started on http://localhost:${PORT} !!`)
    })
}
main().catch(err => console.log(err));