import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Weather } from './schemas/weather.schema';

@Injectable()
export class WeatherService {
    constructor(
        @InjectModel(Weather.name) private weatherModel: Model<Weather>,) { }

    async create(dto: any) {
        const data: any = { ...dto };
        if (data.timestamp) data.timestamp = new Date(data.timestamp);
        const created = new this.weatherModel(data);
        return created.save();
    }

    async findAll(limit = 100) {
        return this.weatherModel.find().sort({ timestamp: -1 }).limit(limit).exec();
    }
}
