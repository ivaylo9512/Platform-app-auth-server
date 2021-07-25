
import { initialize } from '../../../src/app';
import request from 'supertest';
import { getToken } from '../../../src/authentication/jwt';
import { Express } from 'express';
import { MikroORM } from '@mikro-orm/core';

type User = {
    id?: number,
    username: string,
    password?: string,
    name: string,
    description: string,
    location: string,
    email: string,
    role: string,
    age: number
}

const [firstUser, secondUser, thirdUser, forthUser]: User[] = Array.from({length: 4}, (_user, i) => ({
    username: 'testUser' + i, 
    password: 'testUserPassword' + i, 
    name: 'testName' + i, 
    description: 'test description' + i, 
    location: 'test location' + i,
    email: `testEmail${i}@gmail.com`,
    role: 'user',
    age: 25,
    firstName: 'firstNameTest' + i,
    lastName: 'lastNameTest' + i
}))

export const [updatedFirstUser, updatedSecondUser]: User[] = Array.from({length: 2}, (_user, i) => ({
    id: i + 1,
    username: 'testUserUpdated' + i, 
    name: 'testNameUpdated' + i, 
    description: 'test description updated' + i, 
    location: 'test location updated' + i,
    email: `testEmailUpdated${i}@gmail.com`,
    role: 'user',
    age: 25,
    firstName: 'firstNameTestUpdate' + i,
    lastName: 'lastNameTestUpdate' + i
}))

export const adminToken = 'Bearer ' + getToken({
    id: 3, 
    role: 'admin'
})

export let firstToken: string, secondToken: string;
let forthToken:string, refreshToken: string;

let app: Express, orm:MikroORM;

describe('user route tests', () => {
    beforeAll(async() => {
        ({app, orm} = await initialize());
    })

    it('should create first user', async() => {

        const res = await request(app)
            .post('/users/register')
            .set('Content-Type', 'Application/json')
            .send(firstUser)
            .expect(200);

            firstUser.id = res.body.id;
            firstToken = 'Bearer ' + res.get('Authorization');
            delete firstUser.password 

            expect(res.body.id).toBe(1);
            expect(res.body).toEqual(firstUser);
    })

    it('should retrun 422 when register user with exsisting username', async() => {
        const user = {...firstUser, email: 'uniqueEmail@gmail.com', password: 'testPassword'};
        
        const res = await request(app)
            .post('/users/register')
            .set('Content-Type', 'Application/json')
            .send(user)
            .expect(422);

            expect(res.body.username).toBe('User with given username or email already exists.');
    })

    
    it('should retrun 422 when register user with exsisting email', async() => {
        const user = {...firstUser, username: 'uniqueUsername', password: 'testPassword'};
        
        const res = await request(app)
            .post('/users/register')
            .set('Content-Type', 'Application/json')
            .send(user)
            .expect(422);

            expect(res.body.username).toBe('User with given username or email already exists.');
    })

    it('should retrun 422 when register user with invalid fields', async() => {
        const errors = {
            email: "Must be a valid email.", 
            password: "Password must be between 10 and 22 characters",
            username: "Username must be between 8 and 20 characters", 
            name: "You must provide a name.", 
            location: "You must provide a location.", 
            description: "You must provide a description."
        }

        const res = await request(app)
            .post('/users/register')
            .set('Content-Type', 'Application/json')
            .send({})
            .expect(422);

            expect(res.body).toEqual(errors);
    })

    it('should create users when logged user is admin', async() => {
        const adminUser = {
            ...secondUser, 
            username: 'adminUser', 
            email: 'adminUser@gmail.com', 
            role: 'admin'
        }

        const res = await request(app)
            .post('/users/auth/create')
            .set('Content-Type', 'Application/json')
            .set('Authorization', adminToken)
            .send({
                users: [secondUser, thirdUser, forthUser, adminUser]
            })
            expect(200);

            const [{id: secondId}, {id: thirdId}, {id: forthId}, {id: fifthId, role}] = res.body 
            
            secondUser.id = secondId;
            thirdUser.id = thirdId;
            forthUser.id = forthId;
            adminUser.id = fifthId;

            delete secondUser.password;
            delete thirdUser.password;
            delete forthUser.password;
            delete adminUser.password;

            expect([secondId, thirdId, forthId, fifthId]).toEqual([2, 3, 4, 5]);
            expect(res.body).toEqual([secondUser, thirdUser, forthUser, adminUser]);
    })

    it('should return 401 when creating user with user that is not admin', async() => {
        const user = {
            ...firstUser,
            username: 'uniqueUsername', 
            email: 'uniqueEmail@gmail.com',
            password: 'testPassword'
        }

        const res = await request(app)
            .post('/users/auth/create')
            .set('Content-Type', 'Application/json')
            .set('Authorization', firstToken)
            .send({ users: [ user ] })
            .expect(401);

            expect(res.text).toBe('Unauthorized.');
    })

    it('should login user with username', async() => {
        const res = await request(app)
            .post('/users/login')
            .set('Content-Type', 'Application/json')
            .send({
                username: secondUser.username,
                password: 'testUserPassword1'
            })
            .expect(200);

            const refreshCookie = res.get('set-cookie').find(cookie => cookie.includes('refreshToken'));
            expect(refreshCookie).toBeDefined();

            refreshToken = refreshCookie.split(';')[0].split('refreshToken=')[1];
            secondToken = 'Bearer ' + res.get('Authorization');
        
            expect(res.body).toEqual(secondUser);
    })
})