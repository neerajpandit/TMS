import mongoose, { Schema } from "mongoose";

const passengersubcategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
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
            enum: ["0", "1", "2"], // 0 - Not deleted, 1 - Deleted, 2 - Archived
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
passengersubcategorySchema.virtual("color").get(function () {
    if (this.status === "0") {
        return "#00944D";
    } else if (this.status === "1") {
        return "#FF0000";
    }
    return null;
});

const passengermasterSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["0", "1"], //0-Active , 1-Deactive
            default: "0",
        },
        passengersubcategory: [
            {
                type: passengersubcategorySchema,
            },
        ],

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
    }
);

const TMS_PassengerMaster = mongoose.model(
    "TMS_PassengerMaster",
    passengermasterSchema
);

export { TMS_PassengerMaster };
