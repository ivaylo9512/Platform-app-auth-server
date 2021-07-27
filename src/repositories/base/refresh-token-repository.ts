import RefreshToken from "src/entities/refresh-token";
import { EntityData } from "@mikro-orm/core";

export default interface RefreshTokenRepository {
    findById(id: number): Promise<RefreshToken>;
    findByToken(token: string): Promise<RefreshToken | null>
    delete(refreshToken: RefreshToken): Promise<boolean>;
    deleteById(id: number): Promise<number>;
    update(refreshToken: RefreshToken): Promise<number>;
    save(refreshToken: EntityData<RefreshToken>): RefreshToken;
}