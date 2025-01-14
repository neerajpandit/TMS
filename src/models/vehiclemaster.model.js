import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ShiftSchema = new Schema({
    shiftNumber: { type: Number, required: true },
    time: { type: String, required: true },
});

const SeatCountSchema = new Schema({
    seatTypeName: String,
    count: Number,
});

const SeatDistributionSchema = new Schema({
    passengerSubType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_PassengerMaster",
        required: true,
    },
    reservedSeats: { type: Number, required: true },
    passApply: {
        type: String,
        enum: ["0", "1"],  // 1=apply pass, 0=not apply pass
        default: "0",  
       
    },
});

const SeatSchema = new Schema({
    seatType: {
        type: Schema.Types.ObjectId,
        ref: "TMS_SeatMaster",
        required: true,
    },
    passengerType: [{ 
        type: Schema.Types.ObjectId,
        ref: "TMS_PassengerMaster", 
        required: true,
    }],
    totalSeats: { type: Number, required: true },
    maxTicketsCanSell: { type: Number, required: true },
    seatDistribution: [SeatDistributionSchema],
    seatCount: [SeatCountSchema],
});
const DayStationSchema = new Schema({
    day: { type: String, required: true }, // E.g., 'Monday', 'Tuesday', etc.
    stations: [
        {
            stationName: { type: String, required: true },
            shifts: [ShiftSchema], // Array of shifts with timings
        },
    ],
});
const VehicleSchema = new Schema(
    {
        fareType: { type: String, enum: ["Station_Based", "KM_Based"] },
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
        vehicleUnitName: { type: String, required: true },
        vehicleUnitCode: { type: String, required: true },
        route: {
            type: Schema.Types.ObjectId,
            ref: "TMS_RouteMaster",
            required: true,
        },
        schedule: [DayStationSchema],
        isReservation: {
            type: String,
            enum: ["0", "1"],  //0=reserved , 1=not reserved 
        },
        seats: [SeatSchema],
        deletedAt:{
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
    }
);

export const TMS_VehicleMaster = mongoose.model(
    "TMS_VehicleMaster",
    VehicleSchema
);
