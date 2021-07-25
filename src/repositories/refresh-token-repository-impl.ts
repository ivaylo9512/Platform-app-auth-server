import { EntityRepository } from "@mikro-orm/mysql";
import { Repository, EntityData } from "@mikro-orm/core";
import RefreshToken from "src/entities/refresh-token";
import RefreshTokenRepository from "./base/refresh-token-repository";

@Repository(RefreshToken)
export default class RefreshTokenRepositoryImpl extends EntityRepository<RefreshToken> implements RefreshTokenRepository{
    async findById(id: number){
        return this.findOneOrFail({ id });
    }

    async update(refreshToken: RefreshToken){
        return await this.nativeUpdate({id: refreshToken.id}, refreshToken);
    }

    async save(refreshTokenInput: EntityData<RefreshToken>){
        const refreshToken = this.create(refreshTokenInput);
        this.persist(refreshToken);
        
        return refreshToken;
    }

    async delete(refreshToken: RefreshToken){
        await this.remove(refreshToken);

        return true;
    }

    async deleteById(id: number){
        return await this.nativeDelete({ id })
    }
}