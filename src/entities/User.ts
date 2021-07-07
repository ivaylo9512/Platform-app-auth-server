import { Entity, PrimaryKey, Property, DateType } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@Entity()
@ObjectType()
export default class User{
    @Field()    
    @PrimaryKey()
    id!: number

    @Field(() => String)
    @Property({ type: 'text', unique: true })
    username!: string

    @Property({ type: 'text' })
    password!: string

    @Property({ type: 'date' })
    createdAt = new Date();
    
    @Property({ type: DateType, onUpdate: () => new Date() })
    updatedAt = new Date();

    @Field(() => String)
    @Property({ type: 'text' })
    firstName!: string

    @Field(() => String)
    @Property({ type: 'text' })
    lastName!: string

    @Field(() => String)
    @Property({ type: 'text', unique: true })
    email!: string

    @Field(() => String)
    @Property({ type: 'date' })
    age!: Date
}