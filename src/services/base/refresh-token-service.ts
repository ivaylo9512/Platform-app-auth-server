import RefreshToken from "src/entities/refresh-token";
import User from "src/entities/user";

export default interface RefreshTokenService {
    findById(id: number, loggedUser: User): Promise<RefreshToken>;
    create(token: string, owner: User): RefreshToken;
    save(token: string, owner: User): Promise<RefreshToken>;
    delete(token: string): Promise<boolean>;
    deleteById(id: number, loggedUser: User): Promise<boolean>;
    getUserFromToken(token: string): Promise<User>;
}