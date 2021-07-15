import UserInput from "../resolvers/types/login-input";
import UserResponse from "../resolvers/types/user-response";
import User from "../entities/user";
import argon2 from 'argon2';
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import UserService from "./base/user-service";
import validateRegister from "../utils/validateRegister";
import RegisterInput from "../resolvers/types/register-input";
import { v4 } from 'uuid';
import { FORGOT_PASSWORD } from '../constants';
import { Redis } from 'ioredis';
import UpdateInput from "../resolvers/types/update-input";
import { verify } from "jsonwebtoken";
import RefreshToken from "../entities/refresh-token";

export default class UserServiceImpl implements UserService {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    redis: Redis;

    constructor(em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>, redis: Redis){
        this.em = em;
        this.redis = redis;
    }
        
    async findById(id: number): Promise<UserResponse>{
        const user = await this.em.findOne(User, { id })
        if(!user){
            return{
                errors:[{
                    field: 'id',
                    message: `User with id: ${id} doesn't exist.`
                }]
            }
        }
        //Todo check token id vs find userId or role admin
        return {
            user
        }
    }

    async login(userInput: UserInput): Promise<UserResponse> {
        const user = await this.em.findOne(User,  userInput.username ? 
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

    async register(registerInput: RegisterInput): Promise<UserResponse>{
        const errors = validateRegister(registerInput);

        if(errors){
            return{
                errors
            }
        }

        const password = await argon2.hash(registerInput.password);
        const user = this.em.create(User, { 
            username: registerInput.username, 
            password,
            firstName: registerInput.firstName, 
            lastName: registerInput.lastName,
            age: registerInput.age,
            email: registerInput.email
        })

        try{
            await this.em.persist(user).flush();
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

    async update(updateInput: UpdateInput): Promise<UserResponse>{
        const user = await this.em.findOne(User, { id: updateInput.id });

        if(!user){
            return{
                errors: [{
                    field: 'id',
                    message: `User with id: ${updateInput.id} doesn't exist.`
                }]
            }
        }

        UserServiceImpl.updateFields(user, updateInput);
        await this.em.flush();

        return {
            user
        };
    }
    
    async getUserFromToken(token: string, secret: string){
        const payload = verify(token, secret);
        const user = await this.em.findOneOrFail(User, { id: payload.id }, ['refreshTokens'])
        
        if(!user.refreshTokens.getItems().find(rt => rt.token == token)){
            throw new UnauthorizedException('Unauthorized.');
        }

        return user;
    }

    async delete(id: number): Promise<boolean>{
        //Todo check token id vs find userId or role admin

        const user = await this.em.findOne(User, { id });
        if(!user){
            return false;
        }
        this.em.remove(user);
        return true;
    }

    async forgotPassword(email: string){
        const user = await this.em.findOne(User, { email })
        if(!user){
            return false;
        }

        const token = v4();
        await this.redis.set(FORGOT_PASSWORD + token, user.id, 'expire', 1000 * 60 * 60);
                
        await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}>change password</a>`)
        
        return true;
    }

    addToken(user: User, token: string, expiryDays: number){
        const date = new Date();
        date.setDate(date.getDate() + expiryDays);

        const refreshToken = this.em.create(RefreshToken, { 
            token, 
            expiresAt: date
        })
        user.refreshTokens.add(refreshToken);

        this.em.flush()
    }

    static updateFields(user: { [name: string]: any }, fields: UpdateInput){
        Object.entries(fields).forEach(([key, value]) => {
            if(value != undefined){
                user[key] = value
            }
        })
    }
}