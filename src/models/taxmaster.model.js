import mongoose, { Schema } from "mongoose";
const taxmasterSchema = new Schema(
    {
        name: {
            type: String,
            requred: true,
            unique: true,
            trim: true,
        },
        taxPercentage: {
            type: Schema.Types.Decimal128,
            required: true,
            trim: true,
            get: (value) => value.toString(),
        },
        status: {
            type: String,
            required: true,
            enum: ["0", "1"], //0-Active , 1-Deactive
            default: "0",
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
            getters: true,
        },
        toObject: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.id;
            },
            getters: true,
        },
    }
);
taxmasterSchema.virtual("color").get(function () {
    if (this.status === "0") {
        return "#00944D";
    } else if (this.status === "1") {
        return "#FF0000";
    }
    return null;
});

export const TMS_TaxMaster = mongoose.model("TMS_TaxMaster", taxmasterSchema);
