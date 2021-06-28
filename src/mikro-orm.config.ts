import { MikroORM } from '@mikro-orm/core';
import path from 'path';

export default {
    migrations:{
        path: path.join(__dirname, './migrations'),
        pattern: /^[\w-]+\d+\.[tj]s$/
    },
    dbName: 'platform-auth',
    user: 'postgresql',
    password: '1234',
    entities: [],
    debug: process.env.NODE_ENV !== 'production',
    type: 'postgresql'
} as Parameters<typeof MikroORM.init>[0];