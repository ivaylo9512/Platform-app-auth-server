
import request from 'supertest';
import { getToken } from '../../../src/authentication/jwt';
import { Express } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { initialize } from '../../../src/app';

const [firstUser, secondUser, thirdUser, forthUser] = Array.from({length: 4}, (user, i) => ({
    username: 'testUser' + i, 
    password: 'testUserPassword' + i, 
    name: 'testName' + i, 
    description: 'test description' + i, 
    location: 'test location' + i,
    email: `testEmail${i}@gmail.com`,
    role: 'user',
}))

export const [updatedFirstUser, updatedSecondUser] = Array.from({length: 2}, (user, i) => ({
    id: i + 1,
    username: 'testUserUpdated' + i, 
    name: 'testNameUpdated' + i, 
    description: 'test description updated' + i, 
    location: 'test location updated' + i,
    email: `testEmailUpdated${i}@gmail.com`,
    role: 'user'
}))
export const adminToken = 'Bearer ' + getToken({
    id: 3, 
    role: 'admin'
})
export let firstToken, secondToken;
let thirdToken, forthToken;
let refreshToken;

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
            firstUser.role = res.body.role;
            firstToken = 'Bearer ' + res.get('Authorization');
            delete firstUser.password 

            expect(res.body.id).toBe(1);
            expect(res.body).toEqual(firstUser);
    })

    it('should create users when logged user is admin', async() => {

        const res = await request(app)
            .post('/users/auth/create')
            .set('Content-Type', 'Application/json')
            .set('Authorization', adminToken)
            .send([secondUser, thirdUser, forthUser])

            const [{id}, {id: secondId}, {id: thirdId}] = res.body 
            
            secondUser.id = id;
            thirdUser.id = secondId;
            forthUser.id = thirdId;

            delete secondUser.password;
            delete thirdUser.password;
            delete forthUser.password;

            expect(id).toBe(2);
            expect(secondId).toBe(3);
            expect(thirdId).toBe(4);
            expect(res.body).toEqual([secondUser, thirdUser, forthUser]);
    })

    it('should throw UnauthorizedException when creating user with user that is not admin', async() => {
        const res = await request(app)
            .post('/users/auth/create')
            .set('Content-Type', 'Application/json')
            .set('Authorization', firstToken)
            .send(secondUser)
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
    
    afterAll(async() => {
        await orm.close();
    })
})