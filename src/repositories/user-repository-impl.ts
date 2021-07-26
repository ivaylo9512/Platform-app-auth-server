import UserRepository from "./base/user-repository";
import User from "../entities/user";
import { EntityRepository } from "@mikro-orm/mysql";
import { Repository, EntityData } from "@mikro-orm/core";

export default class UserRepositoryImpl extends EntityRepository<User> implements UserRepository{
    async findById(id: number, selections?: string[]){
        return this.findOneOrFail({ id }, selections);
    }

    async findUser(user: EntityData<User>){
        return this.findOne(user);
    }

    async findByUsernameOrEmail(username: string, email: string){
        return this.createQueryBuilder('user')
            .select('*')
            .where(`username = ?  or email = ?`, [username, email])
            .getResult();
    }

    async update(user: User){
        return await this.save(user);
    }

    async updateById(user: User){
        return await this.nativeUpdate({id: user.id}, user);
    }

    async save(userInput: EntityData<User>){
        const user = this.create(userInput);
        await this.persist(user);
        
        return user;
    }

    async saveMany(usersInput: EntityData<User[]>){
        const users = usersInput.map(user => this.create(user));
        await this.persist(users);
        
        return users;
    }

    async delete(user: User){
        await this.remove(user);

        return true;
    }

    async deleteById(id: number){
        return await this.nativeDelete({ id })
    }
}