import { ExtractJwt, Strategy} from 'passport-jwt'
import { jwtSecret } from './authenticate'
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
export const verifyMiddleware = (app: Express) => 
    app.use('**/auth', (req, res, next) => 
        authenticate(strategy, { session: false  }, (error, user, info, status) => {
            if(info){
                return res.status(401).send(info.message);
            }
            
            req.user = user;
            return next();
    }))