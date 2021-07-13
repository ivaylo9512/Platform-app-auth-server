import { sign }  from 'jsonwebtoken';
import User from 'src/entities/User';
import { authenticate } from 'passport';
import { CookieOptions } from 'express';

export const COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: true,
    signed: true,
    maxAge: eval(process.env.REFRESH_TOKEN_EXPIRY || '60 * 60 * 24 * 50') * 1000,
    sameSite: "none",
}
export const getToken = (user: User) => {
    return sign(user, process.env.JWT_SECRET || 'gsdgsdghrtSecretJwt', {
      expiresIn: eval(process.env.SESSION_EXPIRY || '60 * 60 * 24 * 50'),
    })
}
export const getRefreshToken = (user: User) => {
    const refreshToken = sign(user, process.env.REFRESH_TOKEN_SECRET || 'fdsgerhrehSecretJwt', {
      expiresIn: eval(process.env.REFRESH_TOKEN_EXPIRY || '60 * 60 * 24 * 50'),
    })
    return refreshToken
}
export const verifyUser = authenticate("jwt", { session: false })
