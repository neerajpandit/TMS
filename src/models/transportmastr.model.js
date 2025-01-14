import mongoose, { Schema } from "mongoose";

const transportmasterSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            unique: [true, "Name must be unique"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters long"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        status: {
            type: String,
            required: [true, "Status is required"],
            enum: {
                values: ["0", "1"],
                message: 'Status must be either "0" (Active) or "1" (Deactive)',
            },
            default: "0",
        },
        deletedAt: {
            type: Date,
        },
        isdeleted: {
            type: String,
            enum: {
                values: ["0", "1", "2"],
                message:
                    'isdeleted must be "0" (not deleted), "1" (deleted), or "2" (archived)',
            },
            default: "0",
        },
    },
    {
        timestamps: true,
    }
);

export const TMS_TransportMaster = mongoose.model(
    "TMS_TransportMaster",
    transportmasterSchema
);
