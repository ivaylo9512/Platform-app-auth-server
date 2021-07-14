import { sign }  from 'jsonwebtoken';
import User from '../entities/User';
import { CookieOptions } from 'express';
import { DEFAULT_REFRESH_EXPIRY, DEFAULT_JWT_EXPIRY, DEFAULT_REFRESH_SECRET, DEFAULT_JWT_SECRET } from '../constants';

export const refreshSecret = process.env.REFRESH_TOKEN_SECRET || DEFAULT_REFRESH_SECRET;
export const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const jwtExpiry = eval(process.env.JWT_EXPIRY || DEFAULT_JWT_EXPIRY);
const refreshExpiry = eval(process.env.REFRESH_TOKEN_EXPIRY || DEFAULT_REFRESH_EXPIRY);

export const COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: true,
    signed: true,
    maxAge: refreshExpiry * 1000,
    sameSite: "none",
}
export const getToken = (user: User) => sign({ 
        id: user.id 
    }, 
    jwtSecret, {
        expiresIn: jwtExpiry,
})
export const getRefreshToken = (user: User) => sign({
        id: user.id
    }, 
    refreshSecret, {
        expiresIn: refreshExpiry
})
