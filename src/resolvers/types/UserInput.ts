import { InputType, Field } from 'type-graphql'

@InputType()
export default class UserInput {
    @Field()
    username: string
    @Field()
    password: string
}