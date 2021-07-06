import { Resolver, Ctx, Arg, Mutation, Query } from 'type-graphql';
import User from '../entities/User';
import { ApolloContext } from "src/types";
import argon2 from 'argon2';
import UserResponse from './types/UserResponse';
import UserInput from './types/LoginInput';
import RegisterInput from './types/RegisterInput';
import validateEmail from '../helpers/validateEmail';

@Resolver()
export default class UserResolver{
    @Query(() => UserResponse)
    async findById(
        @Arg('id') id: number,
        @Ctx() { em }: ApolloContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { id })
        if(!user){
            return{
                errors:[{
                    field: 'id',
                    message: `Entity with id: ${id} doesn't exist.`
                }]
            }
        }
        //Todo check token id vs find userId or role admin
        return {
            user
        }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('userInput') userInput: UserInput,
        @Ctx() { em }: ApolloContext
    ): Promise<UserResponse> {
        const password = await argon2.hash(userInput.password);
        const user = await em.findOne(User, { 
            ...userInput.username ? { username: userInput.username } : { email: userInput.email }, 
            password 
        })

        if(!user) {
            return {
                errors: [{
                    field: 'login',
                    message: 'Incorrect username, email or password.'
                }]
            }
        }
        return {
            user,
        };
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('registerInput') registerInput: RegisterInput,
        @Ctx() { em }: ApolloContext
    ): Promise<UserResponse> {
        if(!validateEmail(registerInput.email)){
            return {
                errors: [{
                    field: 'email',
                    message: 'Email is incorect'
                }]
            }
        }
        if(registerInput.username.length < 7){
            return {
                errors: [{ 
                    field: 'username', 
                    message: 'Username must be more than 7 characters.'
                }]
            }
        }
        if(registerInput.password.length < 10){
            return {
                errors: [{ 
                    field: 'username', 
                    message: 'Username must be more than 10 characters.'
                }]
            }
        }
        const password = await argon2.hash(registerInput.password);
        const user = em.create(User, { 
            username: registerInput.username, 
            password,
            firstName: registerInput.firstName, 
            lastName: registerInput.lastName,
            age: registerInput.age,
            email: registerInput.email
        })
        try{
            await em.persistAndFlush(user);
        }catch(err){
            if(err.code === '23505' || (err.detail && err.detail.includes('already exists'))){

                if(err.detail.includes('email')){
                    return{
                        errors: [{
                            field: 'email',
                            message: 'Email is already in use.'
                        }]
                    }
                }
                
                return{
                    errors: [{
                        field: 'username',
                        message: 'Username has already been taken'
                    }]
                }
            }
        }

        return {
            user
        };
    }
}