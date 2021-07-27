import User from "src/entities/user";
import { EntityData } from "@mikro-orm/core";

export default interface UserRepository {
    findById(id: number, selections?: string[]): Promise<User>;
    findByUsername(username: string): Promise<User>;
    findUser(user: EntityData<User>): Promise<User | null>
    delete(user: User): boolean;
    deleteById(id: number): Promise<number>;
    update(user: User): User;
    updateById(user: User): Promise<number>;
    createUser(user: EntityData<User>): Promise<User>;
    findByUsernameOrEmail(username: string, email: string): Promise<User[]>
}