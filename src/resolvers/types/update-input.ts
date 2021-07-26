import { Field, InputType } from "type-graphql"

@InputType()
export default class UpdateInput{
    @Field()
    id: number
    @Field()
    username: string
    @Field()
    firstName: string
    @Field()
    lastName: string
    @Field()
    email: string
    @Field()
    age: number
}