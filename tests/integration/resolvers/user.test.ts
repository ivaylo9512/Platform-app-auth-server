import { gql } from 'apollo-server-express';
import { initialize } from '../../../src/app';
import { ApolloServer } from 'apollo-server-express';
import { MikroORM } from '@mikro-orm/core';
import UpdateInput from '../../../src/resolvers/types/update-input';

let firstUser = {
    username: 'testUser', 
    password: 'testPassword', 
    age: 5, 
    email: 'test@gmail.com', 
    firstName: 'test', 
    lastName: 'testName' 
} as UpdateInput

let registerQuery = {
    query: gql`
        mutation register($registerInput: RegisterInput!){
            register(registerInput: $registerInput){
                errors{
                    field
                    message
                }
                user {
                    id,
                    username,
                    age,
                    email,
                    firstName,
                    lastName
                }
            }
        }
    `,
    variables:{ registerInput:
        firstUser 
    },
    operationName: 'register',
};

let server: ApolloServer, orm: MikroORM;

describe('user tests', () => {
    beforeAll(async() => {
        ({server, orm} = await initialize());
    })

    it('should register user', async() => {
        const res = await server.executeOperation(registerQuery);
        const user = res.data?.register.user;
        
        firstUser.id = user.id;
        delete firstUser.password;
        
        expect(firstUser).toEqual(user);
    })

    afterAll(async() => {
        orm.close();
        server.stop()
    })
})