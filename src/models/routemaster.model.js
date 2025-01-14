import mongoose, { Schema } from "mongoose";

const routemasterSchema = new Schema(
    {
        routeName: {
            type: String,
            required: [true, "Route name is required"],
            trim: true,
            minlength: [3, "Route name must be at least 3 characters long"],
            maxlength: [50, "Route name cannot exceed 50 characters"],
        },
        startPoint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TMS_StationMaster",
            required: [true, "Start point is required"],
        },
        endPoint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TMS_StationMaster",
            required: [true, "End point is required"],
        },
        stations: [
            {
                station: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "TMS_StationMaster",
                    required: [true, "Station is required"],
                },
                order: {
                    type: Number,
                    required: [true, "Order is required"],
                    min: [1, "Order must be at least 1"],
                },
                status: {
                    type: String,
                    required: [true, "Status is required"],
                    enum: {
                        values: ["0", "1"],
                        message:
                            'Status must be either "0" (Active) or "1" (Deactive)',
                    },
                    default: "0",
                },
            },
        ],
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
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.id;
            },
        },
        toObject: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.id;
            },
        },
    }
);
routemasterSchema.virtual("color").get(function () {
    if (this.status === "0") {
        return "#00944D";
    } else if (this.status === "1") {
        return "#FF0000";
    }
    return null;
});
export const TMS_RouteMaster = mongoose.model(
    "TMS_RouteMaster",
    routemasterSchema
);
