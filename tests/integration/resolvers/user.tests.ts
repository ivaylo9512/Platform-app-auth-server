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

const [secondUser, thirdUser, forthUser, fifthUser]: User[] = Array.from({length: 4}, (_user, i) => ({
    username: 'testUser' + i, 
    password: 'testUserPassword' + i, 
    email: `testEmail${i}@gmail.com`,
    role: 'user',
    age: 25,
    firstName: 'firstNameTest' + i,
    lastName: 'lastNameTest' + i
}))

const [updateSecondUser, updateThirdUser]: User[] = Array.from({length: 2}, (_user, i) => ({
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

let createRegisterQuery = (user: User) => ({
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
        user 
    },
    operationName: 'register',
})
let createManyQuery = (users: User[]) => ({
    query: `mutation createMany($users: [RegisterInput!]!){
                createMany(users: $users){
                    id,
                    username,
                    age,
                    email,
                    firstName,
                    lastName,
                    role
                }
            }`,
    variables:{ 
        users
    },
    operationName: 'createMany',
});
let userByIdQuery = (id: number) => ({
    query: `query userById($id: Int!){
                userById(id: $id){
                    id
                    username
                }
            }`,
    operationName: 'userById',
    variables: {
        id
    }
});

let app:Express, orm: MikroORM, redis: Redis;
export const resolverTests = () => {
    beforeAll(async() => {
        ({app,redis, orm} = await initialize());

        await createAdminUser();
    })

    afterAll(async() => {
        await orm.close()
        await redis.disconnect();
    })

    it('should register user', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createRegisterQuery(secondUser))
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

    it('should retrun 422 when register user with exsisting username', async() => {
        const user = {...secondUser, email: 'uniqueEmail@gmail.com', password: 'testPassword', id: undefined};
        
        const res = await request(app)
            .post('/graphql')
            .send(createRegisterQuery(user))
            .expect(422);


        const error = res.body.errors[0].extensions;
        expect(error.username).toBe('Username or email is already in use.');
    })
    
    it('should retrun 422 when register user with exsisting email', async() => {
        const user = {...secondUser, username: 'uniqueUsername', password: 'testPassword', id: undefined};
        
        const res = await request(app)
            .post('/graphql')
            .send(createRegisterQuery(user))
            .expect(422);

        const error = res.body.errors[0].extensions;
        expect(error.username).toBe('Username or email is already in use.');
    })

    it('should create users when logged user is admin', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', adminToken)
            .send(createManyQuery([thirdUser, forthUser, fifthUser]))
            .expect(200);

        const users = res.body.data.createMany;
        const [{id: secondId}, {id: thirdId}, {id: forthId}] = users;
        
        thirdUser.id = secondId;
        forthUser.id = thirdId;
        fifthUser.id = forthId;

        delete thirdUser.password;
        delete forthUser.password;
        delete fifthUser.password;

        expect([secondId, thirdId, forthId]).toEqual([3, 4, 5]);
        expect(users).toEqual([thirdUser, forthUser, fifthUser]);
    })

    it('should return 401 when creating user with user that is not admin', async() => {
        const user = {
            ...secondUser,
            username: 'uniqueUsername', 
            email: 'uniqueEmail@gmail.com',
            password: 'testPassword',
            id: undefined
        }

        const res = await request(app)
            .post('/graphql')
            .set('Authorization', firstToken)
            .send(createManyQuery([user]))
            .expect(401);

        expect(res.text).toBe('Unauthorized.');
    })
}