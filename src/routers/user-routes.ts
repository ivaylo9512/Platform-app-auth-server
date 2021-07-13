import { Router } from "express";
import { UserRequest } from "src/types";
import { getToken, getRefreshToken, COOKIE_OPTIONS } from '../utils/authenticate'
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
router.post('/login', async(req: UserRequest, res) => {
    const token = getToken(req.body)
    const refreshToken = getRefreshToken(req.body);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.header('Access-Control-Expose-Headers', 'Authorization'); 
    res.header('Authorization', token);
    
    res.send(await req.service?.login(req.body));
})
router.post('/register', async(req: UserRequest, res) => {
    res.send(await req.service?.register(req.body));
})
export default router;