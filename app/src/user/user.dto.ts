import { IsNotEmpty } from 'class-validator';

export class UserDTO {
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;
}
