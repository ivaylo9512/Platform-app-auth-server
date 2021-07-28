import RegisterInput from "src/resolvers/types/register-input";
import UpdateInput from "src/resolvers/types/update-input";
import User from "src/entities/user";
import RefreshToken from "src/entities/refresh-token";

export default interface UserService {
    findById(id: number, loggedUser: User): Promise<User>;
    findByUsernameOrEmail(username: string, email: string): Promise<User[]>;
    findByUsername(username: string): Promise<User>;
    login(user: any): Promise<User>;
    register(registerInput: RegisterInput): Promise<User>;
    createMany(users: RegisterInput[]): Promise<User[]>;
    delete(id: number, loggedUser: User): Promise<boolean>;
    forgotPassword(email: string): void;
    update(updateInput: UpdateInput, loggedUser: User): Promise<User>;
    addToken(user: User, refreshToken: RefreshToken): void;
    verifyLoggedUser(id?: number): Promise<User>;
}