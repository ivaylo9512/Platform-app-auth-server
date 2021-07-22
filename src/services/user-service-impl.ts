import UserInput from "../resolvers/types/login-input";
import UserResponse from "../resolvers/types/user-response";
import User from "../entities/user";
import argon2 from 'argon2';
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import UserService from "./base/user-service";
import validateRegister from "../utils/validate-register";
import RegisterInput from "../resolvers/types/register-input";
import { v4 } from 'uuid';
import { FORGOT_PASSWORD } from '../constants';
import { Redis } from 'ioredis';
import UpdateInput from "../resolvers/types/update-input";
import { verify } from "jsonwebtoken";
import RefreshToken from "../entities/refresh-token";
import UnauthorizedException from "../expceptions/unauthorized";
import { JwtUser } from "src/authentication/jwt-user";

export default class UserServiceImpl implements UserService {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    redis: Redis;

    constructor(em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>, redis: Redis){
        this.em = em;
        this.redis = redis;
    }
        
    async findById(id: number, loggedUser: JwtUser): Promise<User>{
        if(id != loggedUser.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized.');
        }
        
        return await this.em.findOneOrFail(User, { id });
    }

    async login(userInput: UserInput): Promise<UserResponse> {
        let { username, password, email } = userInput; 

        const user = await this.em.findOne(User,  username ? 
            { username } : { email } 
        )
        
        if(!user || !await argon2.verify(user.password, password)) {
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

    async update(updateInput: UpdateInput, loggedUser: JwtUser): Promise<UserResponse>{
        if(updateInput.id != loggedUser.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized.');
        }

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
        
        const user = await this.em.findOne(User, { id: payload.id }, ['refreshTokens'])
        if(!user){
            throw new UnauthorizedException('Unauthorized.');
        }

        const foundToken = !user.refreshTokens.getItems().find(rt => rt.token == token);
        if(!foundToken){
            throw new UnauthorizedException('Unauthorized.');
        }

        return user;
    }

    async delete(id: number, loggedUser: JwtUser): Promise<boolean>{
        if(id != loggedUser.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized');
        }
        
        const user = await this.em.findOneOrFail(User, { id });
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

    async addToken(user: User, token: string, expiryDays: number){
        const date = new Date();
        date.setDate(date.getDate() + expiryDays);

        const refreshToken = this.em.create(RefreshToken, { 
            token, 
            expiresAt: date
        })
        user.refreshTokens.add(refreshToken);

        await this.em.flush()
    }

    async removeToken(token: string, secret: string){
        const jwtUser = verify(token, secret);
        const user = await this.em.findOneOrFail(User, { id: jwtUser.id }, ['refreshTokens']);

        const foundToken = user.refreshTokens.getItems().find((rt) => rt.token == token);
        if(foundToken){
            await this.em.remove(foundToken).flush();
        }
    }

    static updateFields(user: { [name: string]: any }, fields: UpdateInput){
        Object.entries(fields).forEach(([key, value]) => {
            if(value != undefined){
                user[key] = value
            }
        })
    }
}