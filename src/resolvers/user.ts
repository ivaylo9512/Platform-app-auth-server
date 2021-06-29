import { Resolver, Query, Ctx, Arg, InputType, Field, Mutation, ObjectType } from "type-graphql";
import User from "src/entities/User";
import { ApolloContext } from "src/types";
import argon2 from 'argon2';
import UserResponse from "./types/UserResponse";
import UserInput from "./types/UserInput";

@Resolver()
export default class UserResolver{
    @Query(() => UserResponse)
    async login(
        @Arg('userInput') userInput: UserInput,
        @Ctx() ctx: ApolloContext
    ): Promise<UserResponse> {
        const password = await argon2.hash(userInput.password);
        const user = await ctx.em.findOne(User, { username: userInput.username, password })
        if(!user) {
            return {
                errors: [{
                    field: 'username',
                    message: 'Incorrect username or password.'
                }]
            }
        }
        return {
            user,
        };
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('userInput') userInput: UserInput,
        @Ctx() { em }: ApolloContext
    ): Promise<UserResponse> {
        if(userInput.username.length < 7){
            return {
                errors: [{ 
                    field: 'username', 
                    message: 'Username must be more than 7 characters.'
                }]
            }
        }
        if(userInput.password.length < 10){
            return {
                errors: [{ 
                    field: 'username', 
                    message: 'Username must be more than 10 characters.'
                }]
            }
        }
        const password = await argon2.hash(userInput.password);
        const user = em.create(User, { 
            username: userInput.username, 
            password 
        })
        em.persistAndFlush(user);
        return {
            user
        };
    }
}