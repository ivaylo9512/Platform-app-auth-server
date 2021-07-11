import { Router } from "express";
import { UserRequest } from "src/types";

const router = Router();

router.get('/findById/:id', async (req: UserRequest, res) => {
    res.send(await req.service?.findById(Number(req.params.id)));
})
router.post('/create/', async (req: UserRequest, res) => {
    res.send(await req.service?.register(req.body));
})
router.patch('/update', async (req: UserRequest, res) => {
    res.send(await req.service?.update(req.body));
})
router.delete('/delete/:id', async (req: UserRequest, res) => {
    res.send(await req.service?.delete(Number(req.params.id)));
})
export default router;