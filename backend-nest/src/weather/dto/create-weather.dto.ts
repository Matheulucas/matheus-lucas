import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWeatherDto {
    @IsOptional()
    @IsString()
    timestamp?: string; // ISO string

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    temperature?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    humidity?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    wind_speed?: number;

    @IsOptional()
    @IsString()
    condition?: string;

    // raw/source are optional, no validation deep here
    @IsOptional()
    raw?: any;

    @IsOptional()
    @IsString()
    source?: string;
}
