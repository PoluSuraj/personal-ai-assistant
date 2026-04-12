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
	},
	{timestamps:true}
)

export const OtpSchema = mongoose.model('Otpdb',otpSchema)
