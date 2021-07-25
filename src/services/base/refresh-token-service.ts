import RefreshToken from "src/entities/refresh-token";
import User from "src/entities/user";

export default interface RefreshTokenService {
    findById(id: number, loggedUser: User): Promise<RefreshToken>;
    create(token: string, owner: User): Promise<RefreshToken>;
    delete(refreshToken: RefreshToken, loggedUser: User): Promise<boolean>;
    deleteById(id: number, loggedUser: User): Promise<boolean>;
}