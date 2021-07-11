import UserInput from "src/resolvers/types/login-input";
import UserResponse from "src/resolvers/types/user-response";
import RegisterInput from "src/resolvers/types/register-input";
import { Redis } from "ioredis";
import UpdateInput from "src/resolvers/types/update-input";

export default interface UserService  {
    findById(id: number): Promise<UserResponse>;
    login(userInput: UserInput): Promise<UserResponse>;
    register(registerInput: RegisterInput): Promise<UserResponse>;
    delete(id: number): Promise<boolean>;
    forgotPassword(email: string, redis: Redis): void
    update(updateInput: UpdateInput): Promise<UserResponse>
}