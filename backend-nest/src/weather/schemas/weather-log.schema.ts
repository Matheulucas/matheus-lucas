import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WeatherLogDocument = WeatherLog & Document;

@Schema({ timestamps: true })
export class WeatherLog {
    @Prop({ required: true })
    timestamp: Date;

    @Prop()
    temperature_c: number;

    @Prop()
    humidity_pct: number;

    @Prop()
    wind_kph: number;

    @Prop()
    condition: string;

    @Prop({ type: Object })
    raw: any;
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);
