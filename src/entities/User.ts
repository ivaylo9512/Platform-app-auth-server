import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field } from "type-graphql";

@Entity()
export default class User{
    @Field()    
    @PrimaryKey()
    id!: Number

    @Field(() => String)
    @Property({ type: 'text', unique: true })
    username!: string

    @Property({ type: 'text' })
    password!: string

    @Property({ type: 'date' })
    createdAt = new Date();
    
    @Property({ type: 'date', onUpdate: () => new Date() })
    updatedAt = new Date();
}