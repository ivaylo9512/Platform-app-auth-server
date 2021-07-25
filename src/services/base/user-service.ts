import RegisterInput from "src/resolvers/types/register-input";
import UpdateInput from "src/resolvers/types/update-input";
import User from "src/entities/user";
import { JwtUser } from "src/authentication/jwt-user";
import RefreshToken from "src/entities/refresh-token";

export default interface UserService {
    findById(id: number, loggedUser: JwtUser): Promise<User>;
    findByUsernameOrEmail(username: string, email: string): Promise<User[]>
    login(user: any): Promise<User>;
    register(registerInput: RegisterInput): Promise<User>;
    delete(id: number, loggedUser: JwtUser): Promise<boolean>;
    forgotPassword(email: string): void
    update(updateInput: UpdateInput, loggedUser: JwtUser): Promise<User>
    getUserFromToken(token: string, secret: string): Promise<User>
    addToken(user: User, refreshToken: RefreshToken, expiryDays: number): void
    removeToken(token: string, secret: string): void
}