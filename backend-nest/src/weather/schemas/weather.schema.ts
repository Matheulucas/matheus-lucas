import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Weather extends Document {
    @Prop({ required: true })
    timestamp: Date;

    @Prop()
    temperature: number;

    @Prop()
    humidity: number;

    @Prop()
    wind_speed: number;

    @Prop()
    condition: string;

    @Prop()
    location?: string;

    @Prop()
    probability_of_rain?: number;
}

export const WeatherSchema = SchemaFactory.createForClass(Weather);
