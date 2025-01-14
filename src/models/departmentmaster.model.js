import mongoose, { Schema } from "mongoose";
import validator from "validator";

const departmentmasterSchema = new Schema(
    {
        employeecode: {
            type: String,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        role: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: [true, "email already exist"],
            lowecase: true,
            trim: true,
            validate: [validator.isEmail, "Invalid Email Address"],
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"],
            match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
        },
        counter: {
            type: Schema.Types.ObjectId,
            ref: "TMS_KioskMaster",
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        hashpassword: {
            type: String,
        },
        deletedAt: {
            type: Date,
        },
        isdeleted: {
            type: String,
            enum: ["0", "1", "2"], // 0 - Not deleted, 1 - Deleted, 2 - Archived
            default: "0",
        },
    },
    {
        timestamps: true,
    }
);

export const TMS_DepartmentMaster = mongoose.model(
    "TMS_DepartmentMaster",
    departmentmasterSchema
);
