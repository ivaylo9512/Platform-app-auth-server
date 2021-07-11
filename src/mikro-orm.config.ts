import { MikroORM, ReflectMetadataProvider } from '@mikro-orm/core';
import 'reflect-metadata';
import path from 'path';
import User from './entities/User';

export default {
    migrations:{
        path: path.join(__dirname, './migrations'),
        pattern: /^[\w-]+\d+\.[tj]s$/
    },
    dbName: 'platform-auth',
    user: 'postgres',
    metadataProvider: ReflectMetadataProvider,
    password: '1234',
    entities: [User],
    debug: process.env.NODE_ENV !== 'production',
    type: 'postgresql'
} as Parameters<typeof MikroORM.init>[0];