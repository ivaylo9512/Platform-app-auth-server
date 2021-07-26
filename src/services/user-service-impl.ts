import UserInput from "../resolvers/types/login-input";
import UserResponse from "../resolvers/types/user-response";
import User from "../entities/user";
import argon2 from 'argon2';
import UserService from "./base/user-service";
import RegisterInput from "../resolvers/types/register-input";
import { v4 } from 'uuid';
import { FORGOT_PASSWORD } from '../constants';
import { Redis } from 'ioredis';
import UpdateInput from "../resolvers/types/update-input";
import { verify } from "jsonwebtoken";
import RefreshToken from "../entities/refresh-token";
import UnauthorizedException from "../expceptions/unauthorized";
import { JwtUser } from "src/authentication/jwt-user";
import UserRepositoryImpl from '../repositories/user-repository-impl'

export default class UserServiceImpl implements UserService {
    repo: UserRepositoryImpl;
    redis: Redis;

    constructor(repo: UserRepositoryImpl, redis: Redis){
        this.repo = repo;
        this.redis = redis;
    }
        
    async findById(id: number, loggedUser: JwtUser): Promise<User>{
        if(id != loggedUser.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized.');
        }
        
        return await this.repo.findById(id);
    }

    async findByUsernameOrEmail(username: string, email: string){
        return await this.repo.findByUsernameOrEmail(username, email)
    }

    async login(userInput: UserInput){
        let { username, password, email } = userInput; 

        const user = await this.repo.findUser(username ? 
            { username } : { email } 
        )
        
        if(!user || !await argon2.verify(user.password, password)) {
            throw new UnauthorizedException('Incorrect username, pasword or email.')
        }
        return user
    }

    async register(registerInput: RegisterInput){
        let { username, password, firstName, lastName, age, email } =  registerInput;

        password = await argon2.hash(password);
        const user = await this.repo.save({ 
            username, 
            password,
            firstName, 
            lastName,
            age,
            email
        })

        await this.repo.flush();

        return user;
    }

    async update(updateInput: UpdateInput, foundUser: User){
        let { username, firstName, lastName, age, email } =  updateInput;

        foundUser.username = username;
        foundUser.firstName = firstName;
        foundUser.lastName = lastName;
        foundUser.age = age;
        foundUser.email = email;

        await this.repo.update(foundUser);
        await this.repo.flush();

        return foundUser;
    }
    
    async getUserFromToken(token: string, secret: string){
        const payload = verify(token, secret);
        
        const user = await this.repo.findOne({ id: payload.id }, ['refreshTokens'])
        const foundToken = !user?.refreshTokens.getItems().find(rt => rt.token == token);

        if(!user || !foundToken){
            throw new UnauthorizedException('Unauthorized.');
        }

        return user;
    }

    async delete(id: number, loggedUser: JwtUser){
        if(id != loggedUser.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized.');
        }
        
        const result = await this.repo.deleteById(id);

        return !!result;
    }

    async forgotPassword(email: string){
        const user = await this.repo.findOne({ email })
        if(!user){
            return false;
        }

        const token = v4();
        await this.redis.set(FORGOT_PASSWORD + token, user.id, 'expire', 1000 * 60 * 60);
                
        // await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}>change password</a>`)
        
        return true;
    }

    async addToken(user: User, refreshToken: RefreshToken){
        user.refreshTokens.add(refreshToken);

        await this.repo.flush()
    }

    async removeToken(token: string, secret: string){
        const jwtUser = verify(token, secret);
        const user = await this.repo.findOneOrFail({ id: jwtUser.id }, ['refreshTokens']);

        const foundToken = user.refreshTokens.getItems().find((rt) => rt.token == token);
        if(foundToken){
            await this.repo.remove(foundToken).flush();
        }
    }
}