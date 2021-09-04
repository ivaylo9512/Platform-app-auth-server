import { Entity, PrimaryKey, Property, DateType, OneToMany, Collection, Cascade } from "@mikro-orm/core";
import { Field, ObjectType, Int } from "type-graphql";
import RefreshToken from "./refresh-token";
import UserRepositoryImpl from "../repositories/user-repository-impl";

@Entity({ customRepository: () => UserRepositoryImpl })
@ObjectType()
export default class User{
    @Field(() => Int)    
    @PrimaryKey()
    id!: number;

    @Property({ type: 'text', unique: true })
    @Field(() => String)
    username!: string;

    @Property({ type: 'text' })
    password!: string;

    @Property({ type: 'date' })
    createdAt = new Date();
    
    @Property({ type: 'date', onUpdate: () => new Date() })
    updatedAt = new Date();

    @Field(() => String)
    @Property({ type: 'text' })
    firstName!: string;

    @Field(() => String)
    @Property({ type: 'text' })
    lastName!: string;

    @Field(() => String)
    @Property({ type: 'text', unique: true })
    email!: string;

    @Field(() => DateType, { nullable: true })
    @Property({ type: DateType })
    birth: Date;

    @Field(() => String)
    @Property({ type: 'text' })
    role = 'user';

    @OneToMany(() => RefreshToken, r => r.owner, {cascade: [Cascade.REMOVE], orphanRemoval: true})
    refreshTokens = new Collection<RefreshToken>(this);
}