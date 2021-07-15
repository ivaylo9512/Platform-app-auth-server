import User from "../entities/user";

export class JwtUser {
    id: number
    role: string
    constructor(user: User){
        this.id = user.id;
        this.role = user.role
    }

}