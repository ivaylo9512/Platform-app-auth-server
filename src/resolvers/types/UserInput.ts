import { InputType, Field } from "type-graphql"

@InputType()
class UserInput {
    @Field()
    username: string
    @Field()
    password: string
}