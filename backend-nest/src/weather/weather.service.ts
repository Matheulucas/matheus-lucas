import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { ListWeatherDto } from './dto/list-weather.dto';
import { parseAsync } from 'json2csv';
import { CreateWeatherDto } from './dto/create-weather.dto';
import ExcelJS from 'exceljs';
import { WeatherLog, WeatherLogDocument } from './schemas/weather-log.schema';
import { StatsDto } from './dto/stats.dto';

@Injectable()
export class WeatherService {
    constructor(
        @InjectModel(WeatherLog.name) private readonly weatherModel: Model<WeatherLogDocument>,
    ) { }

    private buildFilter(query?: ListWeatherDto): FilterQuery<WeatherLogDocument> {
        const filter: any = {};
        if (!query) return filter;

        if (query.start || query.end) {
            filter.timestamp = {};
            if (query.start) filter.timestamp.$gte = new Date(query.start);
            if (query.end) filter.timestamp.$lte = new Date(query.end);
        }

        return filter;
    }

    async create(payload: CreateWeatherDto) {
        // normalize timestamp to Date or now
        if (payload.timestamp) {
            try {
                payload.timestamp = new Date(payload.timestamp).toISOString();
            } catch {
                // leave as-is
            }
        } else {
            payload.timestamp = new Date().toISOString();
        }

        const created = await this.weatherModel.create(payload as any);
        return created.toObject ? created.toObject() : created;
    }

    async list(query: ListWeatherDto) {
        const page = query?.page ?? 1;
        const limit = query?.limit ?? 50;
        const skip = (page - 1) * limit;

        const filter = this.buildFilter(query);

        const [items, total] = await Promise.all([
            this.weatherModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean().exec(),
            this.weatherModel.countDocuments(filter).exec(),
        ]);

        return {
            items,
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async stats(): Promise<StatsDto> {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    avgTemperature: { $avg: '$temperature' },
                    minTemperature: { $min: '$temperature' },
                    maxTemperature: { $max: '$temperature' },
                    avgHumidity: { $avg: '$humidity' },
                    minHumidity: { $min: '$humidity' },
                    maxHumidity: { $max: '$humidity' },
                    count: { $sum: 1 },
                },
            },
        ];

        const res = await this.weatherModel.aggregate(pipeline).exec();

        if (!res || res.length === 0) {
            return {
                avgTemperature: null,
                minTemperature: null,
                maxTemperature: null,
                avgHumidity: null,
                minHumidity: null,
                maxHumidity: null,
                count: 0,
            };
        }

        const row = res[0];
        return {
            avgTemperature: row.avgTemperature ?? null,
            minTemperature: row.minTemperature ?? null,
            maxTemperature: row.maxTemperature ?? null,
            avgHumidity: row.avgHumidity ?? null,
            minHumidity: row.minHumidity ?? null,
            maxHumidity: row.maxHumidity ?? null,
            count: row.count ?? 0,
        };
    }

    async exportCsv(query: ListWeatherDto) {
        const filter = this.buildFilter(query);
        const items = await this.weatherModel.find(filter).sort({ timestamp: -1 }).lean().exec();

        // select fields for CSV
        const docs = items.map((d) => ({
            timestamp: d.timestamp ? new Date(d.timestamp).toISOString() : '',
            temperature: d.temperature ?? '',
            humidity: d.humidity ?? '',
            wind_speed: d.wind_speed ?? '',
            condition: d.condition ?? '',
            source: d.source ?? '',
        }));

        const csv = await parseAsync(docs, { fields: ['timestamp', 'temperature', 'humidity', 'wind_speed', 'condition', 'source'] });
        return csv;
    }

    async exportXlsx(query: ListWeatherDto) {
        const filter = this.buildFilter(query);
        const items = await this.weatherModel.find(filter).sort({ timestamp: -1 }).lean().exec();

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('weather_logs');

        sheet.columns = [
            { header: 'timestamp', key: 'timestamp', width: 30 },
            { header: 'temperature', key: 'temperature', width: 12 },
            { header: 'humidity', key: 'humidity', width: 12 },
            { header: 'wind_speed', key: 'wind_speed', width: 12 },
            { header: 'condition', key: 'condition', width: 20 },
            { header: 'source', key: 'source', width: 20 },
        ];

        items.forEach((d) => {
            sheet.addRow({
                timestamp: d.timestamp ? new Date(d.timestamp).toISOString() : '',
                temperature: d.temperature ?? '',
                humidity: d.humidity ?? '',
                wind_speed: d.wind_speed ?? '',
                condition: d.condition ?? '',
                source: d.source ?? '',
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
