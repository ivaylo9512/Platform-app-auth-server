import { check, validationResult } from 'express-validator';
import { NextFunction } from 'express';
import { Response, Request } from "express";
import User from '../entities/user';
import UnauthorizedException from '../exceptions/unauthorized';

const validateRegister = async(req: Request) => await Promise.all(
    [check('email', 'Must be a valid email.').isEmail().run(req),
    check('password', 'Password must be between 10 and 22 characters').isLength({min:10, max: 22}).run(req),
    check('username', 'Username must be between 8 and 20 characters').isLength({min:8, max: 20}).run(req), 
    check('firstName', 'You must provide a firstName.').notEmpty().run(req),
    check('lastName', 'You must provide a lastName.').notEmpty().run(req),
    check('birth', 'You must provide birth.').notEmpty().bail().isDate().withMessage('Birth must be a valid date.').run(req),
])

const validateCreate = async(req: Request) => await Promise.all([
    check('users.*.email', 'Must be a valid email.').isEmail().run(req),
    check('users.*.password', 'Password must be between 10 and 22 characters').isLength({min:10, max: 22}).run(req),
    check('users.*.username', 'Username must be between 8 and 20 characters').isLength({min:8, max: 20}).run(req), 
    check('users.*.firstName', 'You must provide a firstName.').notEmpty().run(req),
    check('users.*.lastName', 'You must provide a lastName.').notEmpty().run(req),
    check('users.*.birth', 'You must provide birth.').notEmpty().bail().isDate().withMessage('Birth must be a valid date.').run(req),
    check('users.*.role', 'You must provide a role.').notEmpty().run(req),
])

const validateUpdate = async(req: Request) => await Promise.all([
    check('id', 'You must provide an id.').notEmpty().bail().isInt().withMessage('You must provide id as a whole number.').run(req),
    check('email', 'Must be a valid email.').isEmail().run(req),
    check('username', 'Username must be between 8 and 20 characters').isLength({min:8, max: 20}).run(req), 
    check('firstName', 'You must provide a firstName.').notEmpty().run(req),
    check('lastName', 'You must provide a lastName.').notEmpty().run(req),
    check('birth', 'You must provide birth.').notEmpty().bail().isDate().withMessage('Birth must be a valid date.').run(req),
])

export const registerValidator = async(req: Request, res: Response, next: NextFunction) => {
    await validateRegister(req);

    const errors = checkForInputErrors(req) || await validateCreateUsernameAndEmail(req);
    if(errors){
        return res.status(422).send(errors);
    }
    next();
}

export const registerResolverValidator = async(req: Request) => {
    await validateRegister(req);

    return checkForInputErrors(req) || await validateCreateUsernameAndEmail(req);
}

export const createResolverValidator = async(req: Request) => {
    await validateCreate(req);

    if(req.foundUser?.role != 'admin'){
        throw new UnauthorizedException('Unauthorized.');
    }

    return checkForArrayInputErrors(req) || await validateCreateUsernamesAndEmails(req);
} 
export const createValidator = async(req: Request, res: Response, next: NextFunction) => {
    await validateCreate(req);
    
    if(req.foundUser?.role != 'admin'){
        return res.status(401).send('Unauthorized.');
    }

    const errors = checkForArrayInputErrors(req) || await validateCreateUsernamesAndEmails(req);

    if(errors){
        return res.status(422).send(errors);
    }

    next();
}

export const updateResolverValidator = async(req: Request) => {
    await validateUpdate(req);

    const loggedUser = req.foundUser!
    if(loggedUser.id != req.body.id && loggedUser.role != 'admin'){
        throw new UnauthorizedException('Unauthorized.');
    }
    
    return checkForInputErrors(req) || await findtUserOrFail(req, loggedUser) || await validateUpdateUsernameAndEmail(req);
}

export const updateValidator = async(req: Request, res: Response, next: NextFunction) => {
    await validateUpdate(req);

    const loggedUser = req.foundUser!
    if(loggedUser.id != req.body.id && loggedUser.role != 'admin'){
        return res.status(401).send('Unauthorized.');
    }

    const errors = checkForInputErrors(req) || await findtUserOrFail(req, loggedUser) || await validateUpdateUsernameAndEmail(req);

    if(errors){
        return res.status(422).send(errors);
    }
    
    next();
}

type Error = {
    [name: string]: string;
}

type Errors = {
    [name: string]: Error;
}

const checkForInputErrors = (req: Request) => {
    const result = validationResult(req);

    if(!result.isEmpty()){
        const errors = result.array().reduce((errorObject: Error, error) => {
            errorObject[error.param] = error.msg;
            
            return errorObject;
        }, {})

        return errors;
    }
}

const checkForArrayInputErrors = (req: Request) => {
    const result = validationResult(req);

    if(!result.isEmpty()){
        const errors = result.array().reduce((errorObject: Errors, error) => {
            const params = error.param.match(/[^\[\].]+/g)!;
            const user = params[0] + params[1];
            const paramName = params[2];

            errorObject[user] = {
                ...errorObject[user], 
                [paramName]: error.msg
            }

            return errorObject;
        }, {})

        return errors;
    }
}

const validateCreateUsernamesAndEmails = async(req: Request) => {
    const error = await req.body.users.reduce(async(errorObject: Errors, user: User, i: number) => {
        const {username, email} = user;
        const foundUser = await req.userService.findByUsernameOrEmail(username, email);
        const errors = await errorObject;

        return foundUser.reduce((error: Errors, user) => {
            if(username == user.username){
                errors['user' + i] = {
                    username: 'Username is already in use.'
                }
            }
    
            if(email == user.email){
                errors['user' + i] = {
                    email: 'Email is already in use.'
                }
            }

            return error
        }, errors); 
    }, {})

    if(Object.keys(error).length > 0){
        return error;
    }
}

const validateCreateUsernameAndEmail = async(req: Request) => {
    const {username, email} = req.body;
    
    const error = (await req.userService.findByUsernameOrEmail(username, email)).reduce((error: Error, user) => {
        if(username == user.username){
            error.username = 'Username is already in use.';
        }

        if(email == user.email){
            error.email = 'Email is already in use.';

        }
        return error
    }, {}); 

    if(Object.keys(error).length > 0){
        return error;
    }
}

const validateUpdateUsernameAndEmail = async(req: Request) => {
    const { id, username, email } = req.body;

    const error = (await req.userService.findByUsernameOrEmail(username, email)).reduce((error: Error, user) => {
        if(user.id != id){
            if(username == user.username){
                error.username = 'Username is already in use.';
            }

            if(email == user.email){
                error.email = 'Email is already in use.';

            }
        }
        return error
    }, {});

    if(Object.keys(error).length > 0){
        return error;
    }
}

const findtUserOrFail = async(req: Request, loggedUser: User) => {
    const id = req.body.id;
    const user = await req.userService.findById(id, loggedUser);
    if(!user){
        return { id: `User with ${id} doesn't exist`};
    } 

    req.foundUser = user;
}