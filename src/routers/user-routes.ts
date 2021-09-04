import { Router, Response, Request } from "express";
import { getToken, getRefreshToken, COOKIE_OPTIONS, refreshExpiry } from '../authentication/jwt'
import User from "../entities/user-entity";
import UserDto from "../entities/dtos/user-dto";
import { createValidator, registerValidator, updateValidator } from "../validators/users-validator";

const router = Router();

router.get('/auth/findById/:id', async(req, res) => {
    res.send(new UserDto(await req.userService.findById(Number(req.params.id), req.foundUser!)));
})

router.get('/findByUsername/:username', async(req, res: Response) => {
    res.send(new UserDto(await req.userService.findByUsername(req.params.username)));
})

router.patch('/auth/update', updateValidator, async(req, res) => {
    res.send(new UserDto(await req.userService.update(req.body, req.foundUser!)));
})

router.delete('/auth/delete/:id', async(req, res) => {
    res.send(await req.userService.delete(Number(req.params.id), req.foundUser!));
})

router.post('/login', async(req, res) => {
    const user = await req.userService.login(req.body);
    await setTokens(res, user, req);
    res.send(new UserDto(user));
})

router.post('/logout', async(req, res) => {
    const { signedCookies: { refreshToken } } = req;
    
    if(refreshToken){
        req.refreshTokenService.delete(refreshToken)
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS)
    res.send();
})

router.post('/register', registerValidator, async(req, res: Response) => {
    const user = await req.userService.register(req.body);
    await setTokens(res, user, req);

    res.send(new UserDto(user));
})

router.post('/auth/createMany', createValidator, async(req, res) => {
    res.send((await req.userService.createMany(req.body.users)).map(user => new UserDto(user)));
})

router.get('/refreshToken', async(req, res) => {
    const { signedCookies: { refreshToken } } = req
    const user = await req.refreshTokenService.getUserFromToken(refreshToken);

    const token = getToken(user);

    res.header('Access-Control-Expose-Headers', 'Authorization'); 
    res.header('Authorization', token);
    
    res.send();
})

const setTokens = async (res: Response, user: User, req: Request) => {
    const token = getToken(user)
    const refreshToken = getRefreshToken(user);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.header('Access-Control-Expose-Headers', 'Authorization'); 
    res.header('Authorization', token);

    await req.refreshTokenService.save(refreshToken, user);
}

export default router;