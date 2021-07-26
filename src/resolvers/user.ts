import { Resolver, Ctx, Arg, Mutation, Query, Int } from 'type-graphql';
import { ApolloContext } from "src/types";
import UserInput from './types/login-input';
import RegisterInput from './types/register-input';
import { jwtSecret } from '../authentication/jwt';
import { verify } from 'jsonwebtoken';
import UnauthorizedException from '../expceptions/unauthorized';
import User from '../entities/user';
import { registerValidator, updateValidator, createValidator } from 'src/validators/users-validator';
import UserDto from 'src/entities/dtos/user-dto';
import UpdateInput from './types/update-input';

@Resolver()
export default class UserResolver{
    @Mutation(() => User)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { services: { userService } }: ApolloContext 
    ){
        userService.forgotPassword(email);
    }
    
    @Query(() => User)
    async userById(
        @Arg('id', () => Int) id: number,
        @Ctx() { services: { userService }, req }: ApolloContext
    ): Promise<User> {
        const loggedUser = UserResolver.getUserFromToken(req.headers?.authorization);
        
        return await userService.findById(id, loggedUser);
    }

    @Query(() => UserDto)
    async userByUsername(
        @Arg('username', () => String) username: string,
        @Ctx() { services: { userService }, req }: ApolloContext
    ): Promise<UserDto> {
        const loggedUser = UserResolver.getUserFromToken(req.headers?.authorization);
        
        return new UserDto(await userService.findByUsername(username);
    }

    @Mutation(() => User)
    async login(
        @Arg('userInput') userInput: UserInput,
        @Ctx() { services: { userService } }: ApolloContext
    ): Promise<User> {
        return await userService.login(userInput);
    }

    @Mutation(() => User)
    async register(
        @Arg('registerInput') registerInput: RegisterInput,
        @Ctx() { services: { userService }, req, res }: ApolloContext
    ): Promise<User> {
        registerValidator(req, res);
        return await userService.register(registerInput);;
    }

    @Mutation(() => UserDto[])
    async createMany(
        @Arg('userInputs') userInputs: RegisterInput[],
        @Ctx() { services: { userService }, req:, res }: ApolloContext
    ): Promise<UserDto[]> {
        createValidator(req, res);
       
        return (await userService!.createMany(userInputs)).map(user => new UserDto(user));
    }

    @Mutation(() => UserDto)
    async update(
        @Arg('updateInput') updateInput: UpdateInput,
        @Ctx() { services: { userService }, req, res }: ApolloContext
    ): Promise<UserDto[]> {
        updateValidator(req, res);
       
        return new UserDto(await userService.update(updateInput, req.foundUser))
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