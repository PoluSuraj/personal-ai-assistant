import mongoose, {Schema} from "mongoose";


const otpSchema = new Schema(
	{
		email:{
			type:String,
			required:true
		},
		otp:{
			type:String,
			required:true
		},
		expiresAt: {
			type: Date,
			required: true,
			default: () => new Date(Date.now() + 10 * 60 * 1000),
		},
	},
	{timestamps:true}
)

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpSchema = mongoose.model('Otpdb',otpSchema)
