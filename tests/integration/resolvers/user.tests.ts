import { gql } from 'apollo-server-express';
import { initialize } from '../../../src/app';
import { ApolloServer } from 'apollo-server-express';
import { MikroORM } from '@mikro-orm/core';
import { getToken } from '../../../src/authentication/jwt';
import request from 'supertest';
import { Express } from 'express';
import UserEntity from '../../../src/entities/user';
import { Redis } from 'ioredis';
import LoginInput from '../../../src/resolvers/types/login-input';

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
    variables:{ 
        registerInput: user 
    },
    operationName: 'register',
})
let createManyMutation = (users: User[]) => ({
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
let createLoginMutation = (user: LoginInput) => ({
    query: `mutation login($loginInput: LoginInput!){
                login(loginInput: $loginInput){
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
        loginInput: user
    },
    operationName: 'login',
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
            .send(createManyMutation([thirdUser, forthUser, fifthUser]))
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
            .send(createManyMutation([user]))

        expect(res.body.errors[0].message).toBe('Unauthorized.');
    })

    it('should login user with username', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createLoginMutation({
                username: thirdUser.username,
                password: 'testUserPassword1'
            }))
            .expect(200);

            console.log(res);
        const refreshCookie = (<Array<String>>(res.get('set-cookie') as unknown))?.find(cookie => cookie.includes('refreshToken'));
        expect(refreshCookie).toBeDefined();

        refreshToken = refreshCookie!.split(';')[0].split('refreshToken=')[1];
        secondToken = 'Bearer ' + res.get('Authorization');
    
        expect(res.body.data.login).toEqual(thirdUser);
    })

    it('should login user with email', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createLoginMutation({
                email: fifthUser.email,
                password: 'testUserPassword3'
            }))
            .expect(200);

        forthToken = 'Bearer ' + res.get('Authorization');
        expect(res.body.data.login).toEqual(fifthUser);
    })

    it('should get token', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Cookie', `refreshToken=${refreshToken}`)
            expect(200);
            
        expect(res.get('Authorization')).toBeDefined();
    })

    it('should return 401 when login user with wrong password', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createLoginMutation({
                email: thirdUser.email,
                password: 'wrongPassword'
            }))

        expect(res.body.errors[0].message).toBe('Incorrect username, pasword or email.');
    })

}