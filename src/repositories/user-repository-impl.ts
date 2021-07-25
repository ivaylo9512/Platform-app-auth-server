import UserRepository from "./base/user-repository";
import User from "src/entities/user";
import { EntityRepository } from "@mikro-orm/mysql";
import { Repository } from "@mikro-orm/core";

@Repository(User)
export default class UserRepositoryImpl extends EntityRepository<User> implements UserRepository{
    async findById(id: number, selections?: string[]){
        return this.findOneOrFail({ id }, selections);
    }

    async findUser(user: any){
        return this.findOne(user);
    }

    async findByUsernameOrEmail(username: string, email: string){
        return this.createQueryBuilder('user')
            .select('*')
            .where(`user.username = ${username} or user.username = ${email}`)
            .execute();

    }

    async update(user: User){
        return await this.nativeUpdate({id: user.id}, user);
    }

    async save(user: User){
        user = this.create(user);
        this.persist(user);
        
        return user;
    }

    async delete(user: User){
        await this.remove(user);

        return true;
    }

    async deleteById(id: number){
        return await this.nativeDelete({ id })
    }
}