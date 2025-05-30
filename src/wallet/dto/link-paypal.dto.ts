import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class LinkPayPalDto {
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({
        description: 'PayPal email address',
        example: 'user@example.com',
    })
    paypalEmail: string;
}