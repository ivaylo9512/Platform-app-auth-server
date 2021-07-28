import { IMiddlewareFunction } from "graphql-middleware";
import { registerResolverValidator, createResolverValidator, updateResolverValidator } from "../../validators/users-validator";
import { UserInputError } from "apollo-server-express";

export const registerMiddleware = {
    Mutation: {
        register: (async (resolve, parent, args, context, info) => {
            const req = context.req;
            req.body = args.registerInput;

            const errors = await registerResolverValidator(req);
            if(errors){
                throw new UserInputError('Register error.', errors)
            }

            return await resolve(parent, args, context, info)
        }) as IMiddlewareFunction,
    },
  }

export const createManyMiddleware = {
    Mutation: {
        createMany: (async (resolve, parent, args, context, info) => {
            const req = context.req;
            req.body = args;

            const errors = await createResolverValidator(req);
            if(errors){
                throw new UserInputError('Create many error.', errors)
            }

            return await resolve(parent, args, context, info)
      }) as IMiddlewareFunction,
    },
}

export const updateManyMiddleware = {
    Mutation: {
        update: (async (resolve, parent, args, context, info) => {
            const { req, res } = context;
            req.body = args.updateInput;

            const errors = await updateResolverValidator(req);
            if(errors){
                throw new UserInputError('Update error.', errors)
            }

            return await resolve(parent, args, context, info)
      }) as IMiddlewareFunction,
    },
}