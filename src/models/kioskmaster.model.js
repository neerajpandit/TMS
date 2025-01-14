import mongoose, { Schema } from "mongoose";

const kioskmasterSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            trim: true,
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

export const TMS_KioskMaster = mongoose.model(
    "TMS_KioskMaster",
    kioskmasterSchema
);
