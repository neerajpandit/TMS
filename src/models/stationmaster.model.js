import mongoose, { Schema } from "mongoose";

const stationMasterSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        longitude: {
            type: String,
            required: true,
            trim: true,
        },
        latitude: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["0", "1"],
            required: true,
        },
        stationCode: {
            type: String,
            required: true,
            unique: true,
        },
        deletedAt: {
            type: Date,
        },
        isdeleted: {
            type: String,
            enum: ["0", "1", "2"], //0=not deleted , 1=delted , 2=archive
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
stationMasterSchema.virtual("color").get(function () {
    if (this.status === "0") {
        return "#00944D";
    } else if (this.status === "1") {
        return "#FF0000";
    }
    return null;
});
export const TMS_StationMaster = mongoose.model(
    "TMS_StationMaster",
    stationMasterSchema
);
