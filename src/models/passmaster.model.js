import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PassengerSubTypeSchema = new Schema({
    passengerType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_PassengerMaster",
        required: true,
    },
    fare: { type: Number, required: true },
    gst: { type: Number, required: true },
    totalprice: { type: Number, required: true },
});

const PassTypeSchema = new Schema({
    passType: { type: String, required: true },
    passengerSubTypes: [PassengerSubTypeSchema],
});
const PricesSchema = new Schema({
    seatTypes: {
        type: Schema.Types.ObjectId,
        ref: "TMS_SeatMaster",
        required: true,
    },
    passType: [PassTypeSchema],
});

const PriceDefinitionSchema = new Schema({
    transportType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_TransportMaster",
        required: true,
    },
    transportSubType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_TransportSubCategory",
        required: true,
    },

    seatTypes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TMS_SeatMaster",
        },
    ],
    passengerSubTypes: [
        {
            type: String,
        },
    ],
    Gst: { type: String, enum: ["Include", "Exclude"], required: true },
    gstType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_TaxMaster",
        required: true,
    },
    passType: [
        {
            type: String,
            enum: ["1", "2", "3", "4", "5"],  // 1=Daily , 2 = Monthly, 3 = Quarterly, 4 = Quarterly, 5 = yearly
            required: true,
        },
    ],
    prices: [PricesSchema],
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
    createdAt: { type: Date, default: Date.now },
});

export const TMS_PassMaster = mongoose.model(
    "TMS_PassMaster",
    PriceDefinitionSchema
);
