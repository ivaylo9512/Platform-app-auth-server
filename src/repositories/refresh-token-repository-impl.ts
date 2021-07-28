import { EntityRepository } from "@mikro-orm/mysql";
import { Repository, EntityData } from "@mikro-orm/core";
import RefreshTokenRepository from "./base/refresh-token-repository";
import RefreshToken from "src/entities/refresh-token";

export default class RefreshTokenRepositoryImpl extends EntityRepository<RefreshToken> implements RefreshTokenRepository{
    findById(id: number){
        return this.findOneOrFail({ id });
    }

    findByToken(token: string){
        return this.findOne({ token });
    }

    update(refreshToken: RefreshToken){
        return this.nativeUpdate({id: refreshToken.id}, refreshToken);
    }

    save(refreshTokenInput: EntityData<RefreshToken>){
        const refreshToken = this.create(refreshTokenInput);
        this.persist(refreshToken);
        
        return refreshToken;
    }

    async delete(refreshToken: RefreshToken){
        await this.remove(refreshToken);

        return true;
    }

    deleteById(id: number){
        return this.nativeDelete({ id })
    }
}