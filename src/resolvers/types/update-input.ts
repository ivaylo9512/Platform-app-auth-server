import { Field, InputType } from "type-graphql"

@InputType()
export default class UpdateInput{
    @Field()
    id: number
    @Field({ nullable: true })
    username?: string
    @Field({ nullable: true })
    password?: string
    @Field({ nullable: true })
    firstName?: string
    @Field({ nullable: true })
    lastName?: string
    @Field({ nullable: true })
    email?: string
    @Field({ nullable: true })
    age?: Date
}