import { Resolver, Ctx, Arg, Mutation, Query, Int } from 'type-graphql';
import { ApolloContext } from "src/types";
import LoginInput from './types/login-input';
import RegisterInput from './types/register-input';
import { getToken, getRefreshToken, COOKIE_OPTIONS } from '../authentication/jwt';
import User from '../entities/user';
import UpdateInput from './types/update-input';
import { Response, Request } from 'express'

@Resolver()
export default class UserResolver{
    @Mutation(() => User)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { req }: ApolloContext 
    ){
        req.userService.forgotPassword(email);
    }
    
    @Query(() => User)
    async userById(
        @Arg('id', () => Int) id: number,
        @Ctx() { req }: ApolloContext
    ): Promise<User> {
        return await req.userService.findById(id, req.foundUser!);
    }

    @Query(() => User)
    async userByUsername(
        @Arg('username') username: string,
        @Ctx() { req }: ApolloContext
    ): Promise<User> {
        return await req.userService.findByUsername(username);
    }

    @Mutation(() => User)
    async login(
        @Arg('loginInput') loginInput: LoginInput,
        @Ctx() { req, res }: ApolloContext
    ): Promise<User> {
        const user = await req.userService.login(loginInput);
        await UserResolver.setTokens(res, user, req);

        return user;
    }

    @Mutation(() => User)
    async register(
        @Arg('registerInput', { validate: false }) registerInput: RegisterInput,
        @Ctx() { req, res }: ApolloContext
    ): Promise<User> {
        const user = await req.userService.register(registerInput);
        await UserResolver.setTokens(res, user, req);

        return user;
    }

    @Mutation(() => [User])
    async createMany(
        @Arg('users', () => [RegisterInput]) userInputs: RegisterInput[],
        @Ctx() { req }: ApolloContext
    ): Promise<User[]> {
        return await req.userService!.createMany(userInputs);
    }

    @Mutation(() => User)
    async update(
        @Arg('updateInput') updateInput: UpdateInput,
        @Ctx() { req }: ApolloContext
    ): Promise<User> {
        return await req.userService.update(updateInput, req.foundUser!)
    }

    @Mutation(() => Boolean)
    async delete(
        @Arg('id', () => Int) id: number,
        @Ctx() { req }: ApolloContext
    ): Promise<boolean>{
        return await req.userService.delete(id, req.foundUser!)
    }

    static async setTokens(res: Response, user: User, req: Request) {
        const token = getToken(user)
        const refreshToken = getRefreshToken(user);
    
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
        res.header('Access-Control-Expose-Headers', 'Authorization'); 
        res.header('Authorization', token);
    
        const refreshTokenEntity = req.refreshTokenService!.create(token, user) 
        await req.userService?.addToken(user, refreshTokenEntity)
    }
}