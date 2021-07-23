import { MikroORM, ReflectMetadataProvider, Dictionary, IPrimaryKey } from '@mikro-orm/core';
import 'reflect-metadata';
import path from 'path';
import User from './entities/user';
import RefreshToken from './entities/refresh-token';
import EntitiyNotFoundException from './expceptions/enitity-not-found';

export default {
    findOneOrFailHandler: (entityName: string, _: Dictionary | IPrimaryKey) => new EntitiyNotFoundException(`${entityName} not found!`),
    migrations:{
        path: path.join(__dirname, './migrations'),
        pattern: /^[\w-]+\d+\.[tj]s$/,
        dropTables: process.env.NODE_ENV === 'test',
    },
    dbName: process.env.NODE_ENV === 'test' ? 'platform-auth-test' : 'platform-auth',
    user: 'postgres',
    metadataProvider: ReflectMetadataProvider,
    password: '1234',
    entities: [User, RefreshToken],
    debug: process.env.NODE_ENV !== 'production',
    type: 'postgresql'
} as Parameters<typeof MikroORM.init>[0];