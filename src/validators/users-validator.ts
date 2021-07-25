import { check, validationResult } from 'express-validator';
import { NextFunction } from 'express';
import { Response } from "express";
import { UserRequest } from 'src/types';
import User from 'src/entities/user';

export const registerValidationRules = () => [
    check('email', 'Must be a valid email.').isEmail(),
    check('password', 'Password must be between 10 and 22 characters').isLength({min:10, max: 22}),
    check('username', 'Username must be between 8 and 20 characters').isLength({min:8, max: 20}), 
    check('firstName', 'You must provide a firstName.').notEmpty(),
    check('lastName', 'You must provide a lastName.').notEmpty(),
    check('age', 'You must provide age.').notEmpty()
]

export const createValidationRules = () => [
    check('users.*.email', 'Must be a valid email.').isEmail(),
    check('users.*.password', 'Password must be between 10 and 22 characters').isLength({min:10, max: 22}),
    check('users.*.username', 'Username must be between 8 and 20 characters').isLength({min:8, max: 20}), 
    check('users.*.firstName', 'You must provide a firstName.').notEmpty(),
    check('users.*.lastName', 'You must provide a lastName.').notEmpty(),
    check('users.*.age', 'You must provide a age.').notEmpty(),
    check('users.*.role', 'You must provide a role.').notEmpty(),
]

export const updateValidatorRules = () => [
    check('id', 'You must provide an id.').notEmpty(),
    check('email', 'Must be a valid email.').isEmail(),
    check('username', 'Username must be between 8 and 20 characters').isLength({min:8, max: 20}), 
    check('firstName', 'You must provide a firstName.').notEmpty(),
    check('lastName', 'You must provide a lastName.').notEmpty(),
    check('age', 'You must provide a age.').notEmpty(),
]

export const registerValidator = async(req: UserRequest, res: Response, next: NextFunction) => {
    if(checkForInputErrors(req, res) || await validateCreateUsernameAndEmail(req, res)){
        return;
    }

    return next()
}

export const createValidator = async(req: UserRequest, res: Response, next: NextFunction) => {
    if(req.user?.role != 'admin'){
        return res.status(401).send('Unauthorized.');
    }

    if(checkForArrayInputErrors(req, res) || await validateCreateUsernamesAndEmails(req, res)){
        return;
    }

    return next();
}

export const updateValidator = async(req: UserRequest, res: Response, next: NextFunction) => {
    if(req.body.id != req.user?.id && req.user?.role != 'admin'){
        return res.status(401).send('Unauthorized.');
    }

    if(checkForInputErrors(req, res) || !await getUserOrFail(req, res) || await validateUpdateUsernameAndEmail(req, res)){
        return;
    }

    return next();
}

type Error = {
    [name: string]: string;
}
type Errors = {
    [name: string]: Error;
}
const checkForInputErrors = (req: UserRequest, res: Response) => {
    const result = validationResult(req);

    if(!result.isEmpty()){
        const errors = result.array().reduce((errorObject: Error, error) => {
            errorObject[error.param] = error.msg;
            
            return errorObject;
        }, {})

        res.status(422).send(errors);
        return errors;
    }

    return;
}

const checkForArrayInputErrors = (req: UserRequest, res: Response) => {
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

        res.status(422).send(errors);
        return errors;
    }

    return;
}

const validateCreateUsernamesAndEmails = async(req: UserRequest, res: Response) => {
    const error = await req.body.users.reduce(async(errorObject: Errors, user: User, i: number) => {
        const {username, email} = user;
        const foundUser = await req.userService?.findByUsernameOrEmail(username, email);
        const errors = await errorObject;
        
        if(foundUser){
            errors['user' + i] = {
                username: 'User with given username or email already exists.'
            }
        }
        
        return errors;
    }, {})

    if(Object.keys(error).length > 0){
        res.status(422).send(error);
        return error;
    }
}

const validateCreateUsernameAndEmail = async(req: UserRequest, res: Response) => {
    const {username, email} = req.body;
    const users = await req.userService!.findByUsernameOrEmail(username, email); 
    if(users.length > 0){
        res.status(422).send({username: 'User with given username or email already exists.'});
        return users;
    }

    return;
}

const validateUpdateUsernameAndEmail = async(req: UserRequest, res: Response) => {
    const { id, username, email } = req.body;
    const users = (await req.userService!.findByUsernameOrEmail(username, email)).filter(user => user.id != id);

    if(users.length > 0){
        res.status(422).send({username: 'Username or email is already in use.' })
        return users;
    }

    return;
}

const getUserOrFail = async(req: UserRequest, res: Response) => {
    const id = req.body.id;
    const user = await req.userService?.findById(id, req.user!);
    if(!user){
        return res.status(422).send({ id: `User with ${id} doesn't exist`});
    } 

    req.foundUser = user;
    return user;
}