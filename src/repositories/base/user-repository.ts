import User from "src/entities/user";

export default interface UserRepository {
    findById(id: number): Promise<User>;
    delete(id: number): Promise<boolean>;
    update(user: User): Promise<User>;
    create(user: User): Promise<User | User[]>;
}