import RefreshTokenService from "./base/refresh-token-service";
import RefreshTokenRepositoryImpl from "../repositories/refresh-token-repository-impl";
import UnauthorizedException from "../expceptions/unauthorized";
import User from "../entities/user";
import RefreshToken from "../entities/refresh-token";
import { refreshExpiry } from "../authentication/jwt";

export default class RefreshTokenServiceImpl implements RefreshTokenService{
    repo: RefreshTokenRepositoryImpl;
    expiryDays: number;

    constructor(repo: RefreshTokenRepositoryImpl){
        this.repo = repo;
        this.expiryDays = refreshExpiry / 60 / 60 / 24
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
        const refreshToken = await this.repo.save({ token, owner });
        await this.repo.flush();

        return refreshToken;
    }

    async delete(refreshToken: RefreshToken, loggedUser: User){
        if(loggedUser.id != refreshToken.owner.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized.');
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
}