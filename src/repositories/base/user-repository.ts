import User from "src/entities/user";

export default interface UserRepository {
    findById(id: number): Promise<User | null>;
    delete(user: User): Promise<boolean>;
    deleteById(id: number): Promise<number>;
    update(user: User): Promise<number>;
    save(user: User): Promise<User | User[]>;
    findByUsernameOrEmail(username: string, email: string): Promise<User>
}