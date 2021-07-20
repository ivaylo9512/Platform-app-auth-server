import { Router, Response, ErrorRequestHandler  } from "express";
import { UserRequest } from "src/types";
import { getToken, getRefreshToken, COOKIE_OPTIONS, refreshExpiry } from '../authentication/authenticate'
import User from "../entities/user";
import { refreshSecret } from "../authentication/authenticate";
import { JwtUser } from "../authentication/jwt-user";
import UnauthorizedException from "../expceptions/unauthorized";
import { verifyUser } from "../authentication/jwt-strategy";

const router = Router();

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    res.status(err.status).send(err.message)
}

router.get('/findById/:id', verifyUser, async(req: UserRequest, res: Response) => {
    const loggedUser = req.user;
    if(!loggedUser){
        throw new UnauthorizedException('Unauthorized.');
    }

    res.send(await req.service?.findById(Number(req.params.id), loggedUser));
}, errorHandler)

router.post('/create/', verifyUser, async(req: UserRequest, res: Response) => {
    res.send(await req.service?.register(req.body));
}, errorHandler)

router.patch('/update', verifyUser, async(req: UserRequest, res: Response) => {
    const loggedUser = req.user;
    if(!loggedUser){
        throw new UnauthorizedException('Unauthorized.');
    }

    res.send(await req.service?.update(req.body, loggedUser));
}, errorHandler)

router.delete('/delete/:id', verifyUser, async(req: UserRequest, res: Response) => {
    const loggedUser = req.user;
    if(!loggedUser){
        throw new UnauthorizedException('Unauthorized.');
    }

    res.send(await req.service?.delete(Number(req.params.id), loggedUser));
}, errorHandler)

router.post('/login', async(req: UserRequest, res) => {
    const userResponse = await req.service?.login(req.body);
    const user = userResponse?.user;

    if(user){
        setTokens(res, user, req);
    }

    res.send(userResponse);
})
router.post('/logout', async(req: UserRequest, res) => {
    const { signedCookies: { refreshToken } } = req;
    
    if(refreshToken){
        req.service?.removeToken(refreshToken, refreshSecret)
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS)
    res.send();
})
router.post('/register', async(req: UserRequest, res) => {
    const userResponse = await req.service?.register(req.body);
    const user = userResponse?.user;
    
    if(user){
        setTokens(res, user, req);
    }

    res.send(userResponse);
})

router.get('/refreshToken', async(req: UserRequest, res) => {
    const { signedCookies: { refreshToken } } = req
    
    const user = await req.service!.getUserFromToken(refreshToken, refreshSecret);

    const token = getToken(user);

    res.header('Access-Control-Expose-Headers', 'Authorization'); 
    res.header('Authorization', token);
    
    res.send();
})

const setTokens = async (res: Response, user: User, req: UserRequest) => {
    const token = getToken(new JwtUser(user))
    const refreshToken = getRefreshToken(new JwtUser(user));

    req.service?.addToken(user, refreshToken, refreshExpiry / 60 / 60 / 24)

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.header('Access-Control-Expose-Headers', 'Authorization'); 
    res.header('Authorization', token);
}

export default router;