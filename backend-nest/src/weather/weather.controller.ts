import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { CreateWeatherDto } from './dto/create-weather.dto';

@Controller('api/weather')
export class WeatherController {
    constructor(private readonly weatherService: WeatherService) { }

    @Post('logs')
    async create(@Body() createWeatherDto: CreateWeatherDto) {
        return this.weatherService.create(createWeatherDto);
    }

    @Get('logs')
    async findAll(@Query('limit') limit = 100) {
        return this.weatherService.findAll(+limit);
    }
}
