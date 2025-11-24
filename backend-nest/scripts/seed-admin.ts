import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get('UsersService');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPass = process.env.ADMIN_PASS || '123456';

    if (!usersService || typeof usersService.findByEmail !== 'function') {
        console.error('UsersService or method findByEmail not found. Adjust seed script to your service API.');
        await app.close();
        return;
    }

    const existing = await usersService.findByEmail(adminEmail);
    if (existing) {
        console.log('Admin already exists:', adminEmail);
        await app.close();
        return;
    }
    const user = await usersService.create({ name: 'Admin', email: adminEmail, password: adminPass });
    console.log('Admin created:', user.email);
    await app.close();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
