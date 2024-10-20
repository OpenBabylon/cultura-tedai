import mongoose from 'mongoose';

import type { UserModel } from '@cultura-ai/types';

import { getMongooseConnection } from '@/lib/mongoose.js';

const schema = new mongoose.Schema<UserModel>(
	{
		_id: Number,
		email: { type: String },
		password: { type: String, select: false },
	},
	{
		collection: 'users',
		strict: false,
		versionKey: false,
		timestamps: false,
		minimize: false,
	},
);

export const User = getMongooseConnection('main').model('User', schema);
