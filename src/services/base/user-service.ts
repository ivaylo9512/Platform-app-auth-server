import UserInput from "src/resolvers/types/login-input";
import UserResponse from "src/resolvers/types/user-response";
import RegisterInput from "src/resolvers/types/register-input";
import UpdateInput from "src/resolvers/types/update-input";
import User from "src/entities/user";
import { JwtUser } from "src/authentication/jwt-user";

export default interface UserService  {
    findById(id: number, loggedUser: JwtUser): Promise<User>;
    login(userInput: UserInput): Promise<UserResponse>;
    register(registerInput: RegisterInput): Promise<UserResponse>;
    delete(id: number, loggedUser: JwtUser): Promise<boolean>;
    forgotPassword(email: string): void
    update(updateInput: UpdateInput, loggedUser: JwtUser): Promise<UserResponse>
    getUserFromToken(token: string, secret: string): Promise<User>
    addToken(user: User, token: string, expiryDays: number): void
    removeToken(token: string, secret: string): void
}