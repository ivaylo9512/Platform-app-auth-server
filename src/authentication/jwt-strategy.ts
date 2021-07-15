import { ExtractJwt, Strategy} from 'passport-jwt'
import { jwtSecret } from './authenticate'
import { use, authenticate } from 'passport'
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
export const verifyUser = authenticate(strategy, { session: false })