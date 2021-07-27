import { gql } from 'apollo-server-express';
import { initialize } from '../../../src/app';
import { ApolloServer } from 'apollo-server-express';
import { MikroORM } from '@mikro-orm/core';
import { getToken } from '../../../src/authentication/jwt';
import request from 'supertest';
import { Express } from 'express';
import UserEntity from '../../../src/entities/user';
import { Redis } from 'ioredis';

type User = {
    id?: number,
    username: string,
    password?: string,
    email: string,
    role: string,
    age: number
}

const [secondUser, thirthUser, forthUser, fifthUser]: User[] = Array.from({length: 4}, (_user, i) => ({
    username: 'testUser' + i, 
    password: 'testUserPassword' + i, 
    email: `testEmail${i}@gmail.com`,
    role: 'user',
    age: 25,
    firstName: 'firstNameTest' + i,
    lastName: 'lastNameTest' + i
}))

const [updateSecondUser, updateThirthUser]: User[] = Array.from({length: 2}, (_user, i) => ({
    id: i + 2,
    username: 'testUserUpdated' + i, 
    email: `testEmailUpdated${i}@gmail.com`,
    role: 'user',
    age: 25,
    firstName: 'firstNameTestUpdate' + i,
    lastName: 'lastNameTestUpdate' + i
}))

const adminToken = 'Bearer ' + getToken({
    id: 1, 
    role: 'admin'
})

let firstToken: string, secondToken: string;
let forthToken:string, refreshToken: string;

const createAdminUser = async () => {
    const repo = orm.em.getRepository(UserEntity);
    const adminUser = repo.create({...secondUser, role: 'admin', username: 'adminUsername', email: 'adminEmail@gmail.com' });
    repo.persist(adminUser);
    await repo.flush()
}

let registerQuery = {
    query: `mutation register($registerInput: RegisterInput!){
                register(registerInput: $registerInput){
                    id,
                    username,
                    age,
                    email,
                    firstName,
                    lastName,
                    role
                }
            }`,
    variables:{ registerInput:
        secondUser 
    },
    operationName: 'register',
};
let userByIdQuery = {
    query: `query userById($id: Int!){
                userById(id: $id){
                    id
                    username
                }
            }`,
    operationName: 'userById',
    variables: {
        id: 1
    }
};

let app:Express, orm: MikroORM, redis: Redis;
export const resolverTests = () => {
    beforeAll(async() => {
        ({app,redis, orm} = await initialize());

        await createAdminUser();
    })
    it('should register user', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(registerQuery)
            .expect(200);
            
            const user = res.body.data.register;

            secondUser.id = user.id;
            const token = res.get('Authorization');
            expect(token).toBeDefined();

            firstToken = 'Bearer ' + token;
            delete secondUser.password 
    
            expect(user.id).toBe(2);
            expect(user).toEqual(secondUser);
    })

    afterAll(async() => {
        await orm.close()
        await redis.disconnect();
    })

}