import UserRepository from "./base/user-repository";
import User from "../entities/user";
import { EntityRepository } from "@mikro-orm/mysql";
import { Repository, EntityData } from "@mikro-orm/core";

export default class UserRepositoryImpl extends EntityRepository<User> implements UserRepository{
    findById(id: number, selections?: string[]){
        return this.findOneOrFail({ id }, selections);
    }

    findByUsername(username: string){
        return this.findOneOrFail({ username });
    }

    findUser(user: EntityData<User>){
        return this.findOne(user);
    }

    findByUsernameOrEmail(username: string, email: string){
        return this.createQueryBuilder('user')
            .select('*')
            .where(`username = ?  or email = ?`, [username, email])
            .getResult();
    }

    update(user: User){
        this.persist(user);
        return user;
    }

    updateById(user: User){
        return this.nativeUpdate({id: user.id}, user);
    }

    async createUser(userInput: EntityData<User>){
        const user = this.create(userInput);
        await this.persist(user);
        
        return user;
    }

    delete(user: User){
        this.remove(user);
        return true;
    }

    async deleteById(id: number){
        return await this.nativeDelete({ id })
    }
}