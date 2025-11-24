import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherModule } from './weather/weather.module';
import { UsersModule } from './users/users.module'; // exemplo

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/meudb'),
    UsersModule,
    WeatherModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
