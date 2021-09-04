import { ExtractJwt, Strategy} from 'passport-jwt'
import { jwtSecret } from './jwt'
import Passport from 'passport'
import { Express } from 'express'
import UserServiceImpl from 'src/services/user-service-impl'

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
Passport.use(strategy);
export const authMiddleware = (app: Express, userService: UserServiceImpl) => {
    app.use('**/auth', (req, res, next) => {
        Passport.authenticate(strategy, { session: false }, async(_error, user, info, _status) => {
            if(info){
                return res.status(401).send(info.message)
            }

            try{
                req.foundUser = await userService.verifyLoggedUser(user.id);
            }catch(err){
                return res.status(err.status || 500).send(err.message)
            }

            return next();
        })(req, res, next)
    })
}
