import { Resolver, Ctx, Arg, Mutation, Query } from 'type-graphql';
import User from '../entities/User';
import { ApolloContext } from "src/types";
import argon2 from 'argon2';
import UserResponse from './types/UserResponse';
import UserInput from './types/LoginInput';
import RegisterInput from './types/RegisterInput';
import validateRegister from '../helpers/validateRegister';
import { v4 } from 'uuid';
import { FORGOT_PASSWORD } from '../constants';

@Resolver()
export default class UserResolver{
    @Mutation(() => UserResponse)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { em, redis }: ApolloContext 
    ){
        const user = await em.findOne(User, { email })
        if(!user){
            return false;
        }

        const token = v4();
        await redis.set(FORGOT_PASSWORD + token, user.id, 'expire', 1000 * 60 * 60);
                
        await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}>change password</a>`)
        
        return true;
    }
    
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
        const user = await em.findOne(User,  userInput.username ? 
            { username: userInput.username } : { email: userInput.email } 
        )
        
        if(!user || !await argon2.verify(user.password, userInput.password)) {
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
        const errors = validateRegister(registerInput);
        if(errors){
            return{
                errors
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