import RefreshToken from "src/entities/refresh-token";

export default interface RefreshTokenRepository {
    findById(id: number): Promise<RefreshToken>;
    delete(user: RefreshToken): Promise<boolean>;
    deleteById(id: number): Promise<number>;
    update(user: RefreshToken): Promise<number>;
    save(user: RefreshToken): Promise<RefreshToken | RefreshToken[]>;
}