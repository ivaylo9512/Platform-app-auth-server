import { ObjectType } from "type-graphql";
import { PrimaryKey, ManyToOne, Entity, Property } from "@mikro-orm/core";
import User from "./user-entity";
import RefreshTokenRepositoryImpl from "../repositories/refresh-token-repository-impl";

@Entity({ customRepository: () => RefreshTokenRepositoryImpl })
@ObjectType()
export default class RefreshToken{
    @PrimaryKey()
    id: number;
    
    @Property({ type: 'text' })
    token: string;

    @ManyToOne({ entity: () => User })
    owner: User;

    @Property({ type: 'date'})
    createdAt = new Date();

    @Property({ type: 'date' })
    expiresAt: Date;
}