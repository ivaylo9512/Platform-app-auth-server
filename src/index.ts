import { MikroORM } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import UserResolver from './resolvers/User';

const main = async () => {
    const orm = await MikroORM.init(mikroConfig)
    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver],
            validate: false
        }),
        context: { em: orm.em } 
    })

    apolloServer.applyMiddleware({ app });

    const PORT = process.env.PORT || 8056;
    app.listen(PORT, () => {
        console.log(`\n🚀!! server started on http://localhost:${PORT} !!`)
    })
}
main().catch(err => console.log(err));