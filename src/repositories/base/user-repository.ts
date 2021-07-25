import User from "src/entities/user";
import UserInput from "src/resolvers/types/login-input";

export default interface UserRepository {
    findById(id: number, selections?: string[]): Promise<User>;
    findUser(user: UserInput): Promise<User | null>
    delete(user: User): Promise<boolean>;
    deleteById(id: number): Promise<number>;
    update(user: User): Promise<number>;
    save(user: User): Promise<User | User[]>;
    findByUsernameOrEmail(username: string, email: string): Promise<User>
}