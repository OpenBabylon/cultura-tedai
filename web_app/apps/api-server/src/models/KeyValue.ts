import mongoose from 'mongoose';

import { getMongooseConnection } from '@/lib/mongoose.js';

const schema = new mongoose.Schema(
	{
		_id: String,
		v: { type: mongoose.Schema.Types.Mixed },
	},
	{
		collection: 'key_values',
		strict: false,
		versionKey: false,
		timestamps: false,
		minimize: false,
	},
);

export const KeyValue = getMongooseConnection('main').model('KeyValue', schema);
