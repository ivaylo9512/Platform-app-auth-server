import RefreshTokenService from "./base/refresh-token-service";
import RefreshTokenRepositoryImpl from "../repositories/refresh-token-repository-impl";
import UnauthorizedException from "../expceptions/unauthorized";
import User from "../entities/user";
import RefreshToken from "../entities/refresh-token";
import { refreshExpiry, refreshSecret } from "../authentication/jwt";
import { verify } from "jsonwebtoken";

export default class RefreshTokenServiceImpl implements RefreshTokenService{
    repo: RefreshTokenRepositoryImpl;
    expiryDays: number;
    secret: string;

    constructor(repo: RefreshTokenRepositoryImpl){
        this.repo = repo;
        this.expiryDays = refreshExpiry / 60 / 60 / 24
        this.secret = refreshSecret;
    }
    
    async findById(id: number, loggedUser: User){
        const refreshToken = await this.repo.findById(id);

        if(loggedUser.id != refreshToken.owner.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized.');
        }

        return refreshToken;
    }

    create(token: string, owner: User){
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.expiryDays);

        return this.repo.create({ token, owner,  expiresAt });
    }

    async save(token: string, owner: User){
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.expiryDays);

        const refreshToken = await this.repo.save({ token, owner, expiresAt });
        await this.repo.flush();

        return refreshToken;
    }

    async delete(token: string){
        try{
            const jwtUser = verify(token, this.secret);
        }catch(err){
            return false;
        }

        const refreshToken = await this.repo.findByToken(token);

        if(!refreshToken){
            return false;
        }
        
        await this.repo.delete(refreshToken)
        await this.repo.flush();

        return true;
    }

    async deleteById(id: number, loggedUser: User){
        const refreshToken = await this.repo.findById(id);
        if(loggedUser.id != refreshToken.owner.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized.');
        }

        return await this.repo.delete(refreshToken);
    }

    async getUserFromToken(token: string){
        const payload = verify(token, this.secret);
        
        const refreshToken = await this.repo.findOne({ token }, ['owner']);
        console.log(refreshToken?.owner)
        if(!refreshToken){
            throw new UnauthorizedException('Unauthorized.');
        }

        return refreshToken.owner;
    }
}