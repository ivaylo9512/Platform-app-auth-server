import { ObjectType, Field } from "type-graphql";

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}