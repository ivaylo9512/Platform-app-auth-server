import { InputType, Field } from 'type-graphql'

@InputType()
export default class LoginInput {
    @Field({ nullable: true })
    username?: string
    @Field({ nullable: true })
    email?: string
    @Field()
    password: string
}