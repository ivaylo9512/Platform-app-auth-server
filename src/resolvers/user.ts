import { Resolver, Ctx, Arg, Mutation, Query, Int } from 'type-graphql';
import { ApolloContext } from "src/types";
import UserResponse from './types/user-response';
import UserInput from './types/login-input';
import RegisterInput from './types/register-input';
import { jwtSecret } from '../authentication/authenticate';
import { verify } from 'jsonwebtoken';
import UnauthorizedException from '../expceptions/unauthorized';
import User from '../entities/user';

@Resolver()
export default class UserResolver{
    @Mutation(() => UserResponse)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { services: { userService } }: ApolloContext 
    ){
        userService.forgotPassword(email);
    }
    
    @Query(() => User)
    async userById(
        @Arg('id', () => Int) id: number,
        @Ctx() { services: { userService}, req }: ApolloContext
    ): Promise<User> {
        const loggedUser = UserResolver.getUserFromToken(req.headers?.authorization);
        
        return await userService.findById(id, loggedUser);
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

    @Mutation(() => Boolean)
    async delete(
        @Arg('id', () => Int) id: number,
        @Ctx() { services: { userService }, req }: ApolloContext
    ): Promise<boolean>{
        const loggedUser = UserResolver.getUserFromToken(req.headers?.authorization);
        
        return await userService.delete(id, loggedUser)
    }

    static getUserFromToken(token?: string) {
        if(!token){
            throw new UnauthorizedException('Unauthorized');
        }
        token = token.split(' ')[1];
    
        const loggedUser = verify(token, jwtSecret);
        if(!loggedUser){
            throw new UnauthorizedException('Unauthorized')
        }

        return loggedUser;
    }
}