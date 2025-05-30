import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class WithdrawalRequestDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(5) // Minimum withdrawal amount
    @ApiProperty({
        description: 'Withdrawal amount',
        example: 50,
        minimum: 5
    })
    amount: number;
}