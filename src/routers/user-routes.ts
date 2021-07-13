import { Router, Response } from "express";
import { UserRequest } from "src/types";
import { getToken, getRefreshToken, COOKIE_OPTIONS } from '../utils/authenticate'
import User from "src/entities/User";
const router = Router();

router.get('/findById/:id', async(req: UserRequest, res) => {
    res.send(await req.service?.findById(Number(req.params.id)));
})

router.post('/create/', async(req: UserRequest, res) => {
    res.send(await req.service?.register(req.body));
})

router.patch('/update', async(req: UserRequest, res) => {
    res.send(await req.service?.update(req.body));
})

router.delete('/delete/:id', async(req: UserRequest, res) => {
    res.send(await req.service?.delete(Number(req.params.id)));
})

router.post('/login', async(req: UserRequest, res: Response) => {
    setTokens(res, req.body);

    res.send(await req.service?.login(req.body));
})
router.post('/register', async(req: UserRequest, res) => {
    setTokens(res, req.body);
    
    res.send(await req.service?.register(req.body));
})

const setTokens = (res: Response, user: User) => {
    const token = getToken(user)
    const refreshToken = getRefreshToken(user);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.header('Access-Control-Expose-Headers', 'Authorization'); 
    res.header('Authorization', token);
}

export default router;