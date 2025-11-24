import { IsNotEmpty, IsNumber, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CreateWeatherDto {
    @IsISO8601()
    timestamp: string;

    @IsNumber()
    temperature: number;

    @IsNumber()
    humidity: number;

    @IsNumber()
    wind_speed: number;

    @IsString()
    condition: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsNumber()
    probability_of_rain?: number;
}
