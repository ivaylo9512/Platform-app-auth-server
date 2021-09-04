import { initialize } from '../../../src/app';
import { MikroORM } from '@mikro-orm/core';
import { getToken } from '../../../src/authentication/jwt';
import request from 'supertest';
import { Express } from 'express';
import UserEntity from '../../../src/entities/user-entity';
import { Redis } from 'ioredis';
import LoginInput from '../../../src/resolvers/types/login-input';
import UpdateInput from '../../../src/resolvers/types/update-input';

type User = {
    id?: number,
    username: string,
    password?: string,
    email: string,
    role: string,
    birth: string,
    firstName: string,
    lastName: string
}

const birth = new Date().toISOString().split('T')[0];
const [secondUser, thirdUser, forthUser, fifthUser]: User[] = Array.from({length: 4}, (_user, i) => ({
    username: 'testUser' + i, 
    password: 'testUserPassword' + i, 
    email: `testEmail${i}@gmail.com`,
    role: 'user',
    birth,
    firstName: 'firstNameTest' + i,
    lastName: 'lastNameTest' + i
}))

const [updateSecondUser, updateThirdUser]: UpdateInput[] = Array.from({length: 2}, (_user, i) => ({
    id: i + 2,
    username: 'testUserUpdated' + i, 
    email: `testEmailUpdated${i}@gmail.com`,
    role: 'user',
    birth,
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
                    birth,
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
                    birth,
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
                    birth,
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

let createUpdateMutation = (user: UpdateInput) => ({
    query: `mutation update($updateInput: UpdateInput!){
                update(updateInput: $updateInput){
                    id,
                    username,
                    birth,
                    email,
                    firstName,
                    lastName,
                    role
                }
            }`,
    variables:{ 
        updateInput: user
    },
    operationName: 'update',
});

let createDeleteMutation = (id: number) => ({
    query: `mutation delete($id: Int!){
                delete(id: $id)
            }`,
    operationName: 'delete',
    variables: {
        id
    }
});

let createUserByUsernameQuery = (username: string) => ({
    query: `query userByUsername($username: String!){
                userByUsername(username: $username){
                    id,
                    username,
                    birth,
                    email,
                    firstName,
                    lastName,
                    role
                }
            }`,
    operationName: 'userByUsername',
    variables: {
        username
    }
})

let createUserByIdQuery = (id: number) => ({
    query: `query userById($id: Int!){
                userById(id: $id){
                    id,
                    username,
                    birth,
                    email,
                    firstName,
                    lastName,
                    role
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

    it('should retrun error when register user with exsisting username', async() => {
        const user = {...secondUser, email: 'uniqueEmail@gmail.com', password: 'testPassword', id: undefined};
        
        const res = await request(app)
            .post('/graphql')
            .send(createRegisterQuery(user))

        const error = res.body.errors[0].extensions.exception;
        expect(error.username).toBe('Username is already in use.');
    })
    
    it('should retrun error when register user with exsisting email', async() => {
        const user = {...secondUser, username: 'uniqueUsername', password: 'testPassword', id: undefined};
        
        const res = await request(app)
            .post('/graphql')
            .send(createRegisterQuery(user))

        const error = res.body.errors[0].extensions.exception;
        expect(error.email).toBe('Email is already in use.');
    })

    it('should create users when logged user is admin', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', adminToken)
            .send(createManyMutation([thirdUser, forthUser, fifthUser]))

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

    it('should return Unauthorized when creating user with user that is not admin', async() => {
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

    // it('should get token', async() => {
    //     const res = await request(app)
    //         .post('/graphql')
    //         .set('Cookie', `refreshToken=${refreshToken}`)
    //         expect(200);
            
    //     expect(res.get('Authorization')).toBeDefined();
    // })

    it('should return Unauthorized when login user with wrong password', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createLoginMutation({
                email: thirdUser.email,
                password: 'wrongPassword'
            }))

        expect(res.body.errors[0].message).toBe('Incorrect username, pasword or email.');
    })

    it('should return secondUser when findById with id 2', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', firstToken)
            .send(createUserByIdQuery(2))

        expect(res.body.data.userById).toEqual(secondUser);
    })

    it('should return Unauthorized when findById with nonexistent id', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', adminToken)
            .send(createUserByIdQuery(252))

        expect(res.body.errors[0].message).toBe('User not found.');
    })

    it('should return Unauthorized when updating user from another loggedUser that is not admin: role', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', secondToken)
            .send(createUpdateMutation(updateSecondUser))

        expect(res.body.errors[0].message).toBe('Unauthorized.');
    })

    it('should update user when updating with same logged user id', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', firstToken)
            .send(createUpdateMutation(updateSecondUser))

        expect(res.body.data.update).toEqual(updateSecondUser);
    })

    it('should update user when updating with logged user with role: admin', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', adminToken)
            .send(createUpdateMutation(updateThirdUser))
            .expect(200);

        expect(res.body.data.update).toEqual(updateThirdUser);
    })

    it('should return Unauthorized when deleting user from another loggedUser that is not admin: role', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', secondToken)
            .send(createDeleteMutation(2))

        expect(res.body.errors[0].message).toBe('Unauthorized.');
    })

    it('should delete user when deleting with same logged user id', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', forthToken)
            .send(createDeleteMutation(5))

        expect(res.body.data.delete).toBe(true);
    })

    it('should delete user when deleting with logged user with role: admin', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', adminToken)
            .send(createDeleteMutation(4))

        expect(res.body.data.delete).toBe(true);
    })

    it('should return error when user from token is unavailable.', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', forthToken)
            .send(createDeleteMutation(5))
            .expect(200);

        expect(res.body.errors[0].message).toBe('User from token is unavailable.');
    })

    it('should return false when deleting nonexistent user', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', adminToken)
            .send(createDeleteMutation(5))
            .expect(200);

        expect(res.body.data.delete).toBe(false);
    })

    it('should return error when updating nonexistent user', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Content-Type', 'Application/json')
            .set('Authorization', adminToken)
            .send(createUpdateMutation(fifthUser as UpdateInput))

        expect(res.body.errors[0].message).toBe('User not found.');
    })

    it('should return error when creating users with usernames that are already in use', async() => {
        const error = {
            user0: {username: 'Username is already in use.'}, 
            user1: {username: 'Username is already in use.'}
        }
        const secondUser = {...updateSecondUser, email: 'uniqueEmail1@gmail.com', password: 'testPassword', id: undefined};
        const thirdUser = {...updateThirdUser, email: 'uniqueEmail1@gmail.com', password: 'testPassword', id: undefined};

        const res = await request(app)
            .post('/graphql')
            .set('Authorization', adminToken)
            .send(createManyMutation([secondUser, thirdUser]));

        expect(res.body.errors[0].extensions.exception).toEqual(error)
    })

    it('should return error when creating users with emails that are already in use.', async() => {
        const error = {
            user0: {email: 'Email is already in use.'}, 
            user1: {email: 'Email is already in use.'}
        }
        const secondUser = {...updateSecondUser, username: 'uniqueUsername', password: 'testPassword', id: undefined};
        const thirdUser = {...updateThirdUser, username: 'uniqueUsername1', password: 'testPassword', id: undefined};

        const res = await request(app)
            .post('/graphql')
            .set('Authorization', adminToken)
            .send(createManyMutation([secondUser, thirdUser]));
            
        expect(res.body.errors[0].extensions.exception).toEqual(error)
    })

    it('should return error when updating user with username that is in use', async() => {
        const user = {...updateSecondUser, username: updateThirdUser.username}
        const error = {username: 'Username is already in use.'};
        
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', firstToken)
            .send(createUpdateMutation(user))

        expect(res.body.errors[0].extensions.exception).toEqual(error);
    })

    it('should return error when updating user with email that is in use', async() => {
        const user = {...updateSecondUser, email: updateThirdUser.email}
        const error = {email: 'Email is already in use.'};

        const res = await request(app)
            .post('/graphql')
            .set('Authorization', firstToken)
            .send(createUpdateMutation(user))

        expect(res.body.errors[0].extensions.exception).toEqual(error);
    })

    it('should return user when userByUsername', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createUserByUsernameQuery(updateSecondUser.username))

        expect(res.body.data.userByUsername).toEqual(updateSecondUser)
    })

    it('should return error when userByUsername with nonexistent username', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createUserByUsernameQuery('nonExistent'))

        expect(res.body.errors[0].message).toEqual('User not found.')
    })
    
    it('should return error when deleting user wtihout token', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createDeleteMutation(1))

        expect(res.body.errors[0].message).toBe('No auth token');
    })

    it('should return error when deleting user with incorrect token', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', 'Bearer incorrect token')
            .send(createDeleteMutation(1))

        expect(res.body.errors[0].message).toBe('jwt malformed');
    })

    it('should return error when updating user wtihout token', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createUpdateMutation(updateSecondUser))

        expect(res.body.errors[0].message).toBe('No auth token');
    })

    it('should return error when updating user with incorrect token', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', 'Bearer incorrect token')
            .send(createUpdateMutation(updateSecondUser))

        expect(res.body.errors[0].message).toBe('jwt malformed');
    })

    it('should return error when creating user wtihout token', async() => {
        const res = await request(app)
            .post('/graphql')
            .send(createManyMutation([{...thirdUser, password: 'testPassswrod', id: undefined}]))

        expect(res.body.errors[0].message).toBe('No auth token');
    })

    it('should return error when creating user with incorrect token', async() => {
        const res = await request(app)
            .post('/graphql')
            .set('Authorization', 'Bearer incorrect token')
            .send(createManyMutation([{...thirdUser, password: 'testPassswrod', id: undefined}]))

        expect(res.body.errors[0].message).toBe('jwt malformed');
    })
}
