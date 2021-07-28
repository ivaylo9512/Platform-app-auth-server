import { InputType, Field, Int } from "type-graphql";
import { IsEmail, Length, IsNotEmpty, IsInt } from 'class-validator';

@InputType()
export default class RegisterInput {
    @Field()
    username: string
    @Field()
    password: string
    @Field()
    firstName: string
    @Field()
    lastName: string
    @Field()
    email: string
    @Field()
    age: number
    @Field()
    role: string
}