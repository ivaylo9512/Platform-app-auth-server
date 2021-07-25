import RefreshTokenService from "./base/refresh-token-service";
import RefreshTokenRepositoryImpl from "src/repositories/refresh-token-repository-impl";
import UnauthorizedException from "src/expceptions/unauthorized";
import User from "src/entities/user";
import RefreshToken from "src/entities/refresh-token";

export default class RefreshTokenServiceImpl implements RefreshTokenService{
    repo: RefreshTokenRepositoryImpl;

    constructor(repo: RefreshTokenRepositoryImpl){
        this.repo = repo;
    }
    
    async findById(id: number, loggedUser: User){
        const refreshToken = await this.repo.findById(id);

        if(loggedUser.id != refreshToken.owner.id && loggedUser.role != 'admin'){
            throw new UnauthorizedException('Unauthorized.');
        }

        return refreshToken;
    }

    async create(token: string, owner: User){
        return this.repo.create({ token, owner });
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