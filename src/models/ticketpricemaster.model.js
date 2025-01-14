import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Schema for storing fare details based on passenger type
const PriceRangeSchema = new Schema({
    passengerType: { type: String, required: true },
    fare: { type: Number },
    gst: { type: Number },
    totalprice: { type: Number },
});

// Schema for seat type details, including the route and associated fare
const SeatTypeSchema = new Schema({
    from: { type: String, default: "P" },
    upto: { type: String, default: "P" },
    seatType: { type: String, required: true },
    passengerSubTypes: [PriceRangeSchema],
});

// Main schema for the price definition
const PriceDefinitionSchema = new Schema({
    fareType: {
        type: String,
        enum: ["Station_Based", "KM_Based"],
        // required: true,
    },
    transportType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_TransportMaster",
        // required: true
    },
    transportSubType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_TransportSubCategory",
        // required: true
    },
    seatTypes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TMS_SeatMaster",
        },
    ],
    route: {
        type: Schema.Types.ObjectId,
        ref: "TMS_RouteMaster",
        // required: true
    },
  passengerSubTypes: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TMS_PassengerMaster",
    },
],

    Gst: { type: String, enum: ["Include", "Exclude"] },
    gstType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_TaxMaster",
        // required: true
    },
    prices: [SeatTypeSchema],
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

// Exporting the model
export const TMS_TicketPriceMaster = mongoose.model(
    "TMS_TicketPriceMaster",
    PriceDefinitionSchema
);
