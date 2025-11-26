import { Controller, Get, Query, Res, Header, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ListWeatherDto } from './dto/list-weather.dto';
import { CreateWeatherDto } from './dto/create-weather.dto';
import type { Response } from 'express';

@Controller('api/weather')
export class WeatherController {
    constructor(private readonly weatherService: WeatherService) { }

    @Post('logs')
    @HttpCode(HttpStatus.CREATED)
    async createLog(@Body() body: CreateWeatherDto) {
        const created = await this.weatherService.create(body);
        return { id: created._id, createdAt: created.createdAt ?? created.timestamp };
    }

    @Get('logs')
    async list(@Query() query: ListWeatherDto) {
        return this.weatherService.list(query);
    }

    @Get('stats')
    async stats() {
        return this.weatherService.stats();
    }

    @Get('export.csv')
    @Header('Content-Type', 'text/csv')
    @Header('Content-Disposition', 'attachment; filename="weather_logs.csv"')
    async exportCsv(@Query() query: ListWeatherDto, @Res({ passthrough: true }) res: Response) {
        const csv = await this.weatherService.exportCsv(query);
        res.send(csv);
    }

    @Get('export.xlsx')
    @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @Header('Content-Disposition', 'attachment; filename="weather_logs.xlsx"')
    async exportXlsx(@Query() query: ListWeatherDto, @Res() res: Response) {
        const buffer = await this.weatherService.exportXlsx(query);
        res.setHeader('Content-Length', buffer.length.toString());
        res.send(buffer);
    }
}
