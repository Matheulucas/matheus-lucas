import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

    async create(dto: any) {
        const data: any = { ...dto };
        if (data.password) {
            const salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(data.password, salt);
        }
        const created = new this.userModel(data);
        return created.save();
    }

    async findAll() {
        return this.userModel.find().select('-password').exec();
    }

    async findByEmail(email: string) {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string) {
        return this.userModel.findById(id).select('-password').exec();
    }

    async update(id: string, updateData: any) {
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }
        return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password').exec();
    }

    async remove(id: string) {
        return this.userModel.findByIdAndDelete(id).exec();
    }
}
