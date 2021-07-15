import { ObjectType, Field } from "type-graphql";
import { PrimaryKey, ManyToOne, Entity, Property } from "@mikro-orm/core";
import User from "./user";
import { type } from "os";

@Entity()
@ObjectType()
export default class RefreshToken{
    @PrimaryKey()
    id: number;
    
    @ManyToOne({ entity: () => User })
    owner: User;

    @Property({ type: 'date'})
    createdAt = new Date();

    @Property({ type: 'date' })
    expiresAt: Date;
}