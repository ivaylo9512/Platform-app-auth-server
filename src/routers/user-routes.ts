import { Router } from "express";
import { UserRequest } from "src/types";

const router = Router();

router.get('/findById/:id', (req: UserRequest, res) => {
    res.send(req.service?.findById(Number(req.params.id)));
})
router.post('/create/', (req: UserRequest, res) => {
    res.send(req.service?.register(req.body));
})
router.patch('/update', (req: UserRequest, res) => {
    res.send(req.service?.update(req.body));
})
router.delete('/delete/:id', (req: UserRequest, res) => {
    res.send(req.service?.delete(req.params.id);
})
export default router;