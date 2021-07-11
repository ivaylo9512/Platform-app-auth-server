import { Resolver, Ctx, Arg, Mutation, Query } from 'type-graphql';
import { ApolloContext } from "src/types";
import UserResponse from './types/user-response';
import UserInput from './types/login-input';
import RegisterInput from './types/register-input';

@Resolver()
export default class UserResolver{
    @Mutation(() => UserResponse)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { services: { userService } }: ApolloContext 
    ){
        userService.forgotPassword(email);
    }
    
    @Query(() => UserResponse)
    async findById(
        @Arg('id') id: number,
        @Ctx() { services: { userService } }: ApolloContext
    ): Promise<UserResponse> {
        return await userService.findById(id);
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('userInput') userInput: UserInput,
        @Ctx() { services: { userService } }: ApolloContext
    ): Promise<UserResponse> {
        return await userService.login(userInput);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('registerInput') registerInput: RegisterInput,
        @Ctx() { services: { userService } }: ApolloContext
    ): Promise<UserResponse> {
        return await userService.register(registerInput);
    }
}