import { ObjectType, Field } from 'type-graphql';
import User from '../../entities/User'
import FieldError from './field-error';

@ObjectType()
export default class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}