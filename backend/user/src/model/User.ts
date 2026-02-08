import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
}

const userSchema: Schema<IUser> = new Schema(
{
    name: {
        type: String,
        // required: true,  
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },

    // password: {
    //     type: String,
    //     required: true,
    //     select: false
    // }

},
{
    timestamps: true
}
);

// Explicit index
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
