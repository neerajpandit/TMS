import mongoose, { Schema } from "mongoose";

const transportsubcategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        transportID: {
            type: String,
            unique: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["0", "1"], // 0-Active , 1-Deactive
            default: "0",
        },
        transportMasterid: {
            type: Schema.Types.ObjectId,
            ref: "TMS_TransportMaster",
        },
        deletedAt: {
            type: Date,
        },
        isdeleted: {
            type: String,
            enum: ["0", "1", "2"], // 0=not deleted , 1=deleted , 2=archive
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

transportsubcategorySchema.virtual("color").get(function () {
    if (this.status === "0") {
        return "#00944D";
    } else if (this.status === "1") {
        return "#FF0000";
    }
    return null;
});

export const TMS_TransportSubCategory = mongoose.model(
    "TMS_TransportSubCategory",
    transportsubcategorySchema
);
