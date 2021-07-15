import UserInput from "src/resolvers/types/login-input";
import UserResponse from "src/resolvers/types/user-response";
import RegisterInput from "src/resolvers/types/register-input";
import UpdateInput from "src/resolvers/types/update-input";
import User from "src/entities/user";

export default interface UserService  {
    findById(id: number): Promise<UserResponse>;
    login(userInput: UserInput): Promise<UserResponse>;
    register(registerInput: RegisterInput): Promise<UserResponse>;
    delete(id: number): Promise<boolean>;
    forgotPassword(email: string): void
    update(updateInput: UpdateInput): Promise<UserResponse>
    getUserFromToken(token: string, secret: string): Promise<User>
    addToken(user: User, token: string, expiryDays: number): void
}