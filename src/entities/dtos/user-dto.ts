import User from "../user";

export default class UserDto{
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    birth: string;
    email: string;
    role: string;

    constructor(user: User){
        this.id = user.id;
        this.username = user.username;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.birth = user.birth.toISOString().split('T')[0];
        this.email = user.email;
        this.role = user.role;
    }
} 