import { Router, Response } from "express";
import { UserRequest } from "src/types";
import { getToken, getRefreshToken, COOKIE_OPTIONS, refreshExpiry } from '../authentication/jwt'
import User from "../entities/user";
import { refreshSecret } from "../authentication/jwt";
import { JwtUser } from "../authentication/jwt-user";
import UnauthorizedException from "../expceptions/unauthorized";
import UserDto from "../entities/dtos/user-dto";
import { createValidationRules, createValidator, registerValidationRules, registerValidator, updateValidatorRules, updateValidator } from "../validators/users-validator";

const router = Router();

router.get('/auth/findById/:id', async(req: UserRequest, res: Response) => {
    const loggedUser = req.user;
    if(!loggedUser){
        throw new UnauthorizedException('Unauthorized.');
    }

    res.send(new UserDto(await req.userService!.findById(Number(req.params.id), loggedUser)));
})

router.get('/findByUsername/:username', async(req: UserRequest, res: Response) => {
    res.send(new UserDto(await req.userService!.findByUsername(req.params.username)));
})

router.patch('/auth/update', updateValidatorRules, updateValidator, async(req: UserRequest, res: Response) => {
    res.send(new UserDto(await req.userService!.update(req.body, req.foundUser!)));
})

router.delete('/auth/delete/:id', async(req: UserRequest, res: Response) => {
    const loggedUser = req.user;
    if(!loggedUser){
        throw new UnauthorizedException('Unauthorized.');
    }

    res.send(await req.userService?.delete(Number(req.params.id), loggedUser));
})

router.post('/login', async(req: UserRequest, res) => {
    const user = await req.userService!.login(req.body);

    if(user){
        await setTokens(res, user, req);
    }

    res.send(new UserDto(user));
})

router.post('/logout', async(req: UserRequest, res) => {
    const { signedCookies: { refreshToken } } = req;
    
    if(refreshToken){
        req.userService?.removeToken(refreshToken, refreshSecret)
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS)
    res.send();
})

router.post('/register', registerValidationRules, registerValidator, async(req: UserRequest, res: Response) => {
    const user = await req.userService!.register(req.body);
    
    if(user){
        await setTokens(res, user, req);
    }

    res.send(new UserDto(user));
})

router.post('/auth/createMany', createValidationRules, createValidator, async(req: UserRequest, res: Response) => {
    res.send((await req.userService!.createMany(req.body.users)).map(user => new UserDto(user)));
})

router.get('/refreshToken', async(req: UserRequest, res) => {
    const { signedCookies: { refreshToken } } = req
    
    const user = await req.userService!.getUserFromToken(refreshToken, refreshSecret);

    const token = getToken(user);

    res.header('Access-Control-Expose-Headers', 'Authorization'); 
    res.header('Authorization', token);
    
    res.send();
})

const setTokens = async (res: Response, user: User, req: UserRequest) => {
    const token = getToken(new JwtUser(user))
    const refreshToken = getRefreshToken(new JwtUser(user));

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.header('Access-Control-Expose-Headers', 'Authorization'); 
    res.header('Authorization', token);

    const refreshTokenEntity = req.refreshTokenService!.create(token, user) 
    await req.userService?.addToken(user, refreshTokenEntity)
}

export default router;