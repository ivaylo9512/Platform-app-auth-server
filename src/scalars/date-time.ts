import { GraphQLScalarType } from "graphql";

export const DateTypeScalar = new GraphQLScalarType({
  name: "DateType",
  description: "DateType object date scalar type",

  serialize(value: Date) {
    return value; 
  },
});