import { ExtractJwt, Strategy} from 'passport-jwt'
import { jwtSecret } from './jwt'
import { use, authenticate } from 'passport'
import { Express } from 'express'

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret
}
const strategy = new Strategy(opts, (payload, done) => {
    return done(null, {
        id: payload.id,
        role: payload.role
    });
})
use(strategy);
export const authMiddleware = (app: Express) => {
    app.use('**/auth', (req, res, next) => {
        authenticate(strategy, { session: false }, async(_error, user, info, _status) => {
            if(info){
                return res.status(401).send(info.message)
            }
            req.foundUser = await req.userService.verifyLoggedUser(user.id);

            return next();
        })(req, res, next)
    })
}
