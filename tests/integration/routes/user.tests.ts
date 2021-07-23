
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
    
    afterAll(async() => {
        await orm.close();
    })
})