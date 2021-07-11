import { InputType, Field } from "type-graphql";

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
    age: Date
}