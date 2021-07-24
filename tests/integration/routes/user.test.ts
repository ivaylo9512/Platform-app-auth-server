
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

            const user = res.body.user;

            firstUser.id = user.id;
            firstToken = 'Bearer ' + res.get('Authorization');
            delete firstUser.password 

            expect(user.id).toBe(1);
            expect(user).toEqual(firstUser);
    })


})