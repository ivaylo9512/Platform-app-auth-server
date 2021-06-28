import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export default class User{
    @PrimaryKey()
    id!: Number

    @Property({ type: 'text' })
    username!: string

    @Property({ type: 'text' })
    password!: string

    @Property({ type: 'date' })
    createdAt = new Date();
    
    @Property({ type: 'date', onUpdate: () => new Date() })
    updatedAt = new Date();
}