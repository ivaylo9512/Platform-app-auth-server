import UserInput from "../resolvers/types/login-input";
import UserResponse from "../resolvers/types/user-response";
import User from "../entities/User";
import argon2 from 'argon2';
import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import UserService from "./base/user-service";
import validateRegister from "src/helpers/validateRegister";
import RegisterInput from "src/resolvers/types/register-input";
import { v4 } from 'uuid';
import { FORGOT_PASSWORD } from '../constants';
import Redis from 'ioredis';
import UpdateInput from "src/resolvers/types/update-input";

export default class UserServiceImpl implements UserService {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    
    constructor(em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>){
        this.em = em;
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
            await this.em.persistAndFlush(user);
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

    async delete(id: number): Promise<boolean>{
        //Todo check token id vs find userId or role admin

        const user = await this.em.findOne(User, { id });
        if(!user){
            return false;
        }
        this.em.removeAndFlush(user);
        return true;
    }

    async forgotPassword(email: string, redis: Redis){
        const user = await this.em.findOne(User, { email })
        if(!user){
            return false;
        }

        const token = v4();
        await redis.set(FORGOT_PASSWORD + token, user.id, 'expire', 1000 * 60 * 60);
                
        await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}>change password</a>`)
        
        return true;
    }

    static updateFields(user: { [name: string]: any }, fields: UpdateInput){
        Object.entries(fields).forEach(([key, value]) => {
            if(value != undefined){
                user[key] = value
            }
        })
    }
}