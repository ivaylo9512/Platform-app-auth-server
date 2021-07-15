import { Entity, PrimaryKey, Property, DateType, OneToMany, Collection } from "@mikro-orm/core";
import { Field, ObjectType, Int } from "type-graphql";
import RefreshToken from "./refresh-token";

@Entity()
@ObjectType()
export default class User{
    @Field(() => Int)    
    @PrimaryKey()
    id!: number;

    @Field(() => String)
    @Property({ type: 'text', unique: true })
    username!: string;

    @Property({ type: 'text' })
    password!: string;

    @Property({ type: 'date' })
    createdAt = new Date();
    
    @Property({ type: DateType, onUpdate: () => new Date() })
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

    @Field(() => Int)
    @Property()
    age!: number;

    @Field(() => String)
    @Property({ type: 'text' })
    role = 'user';

    @OneToMany(() => RefreshToken, r => r.owner)
    refreshTokens = new Collection<RefreshToken>(this);
}