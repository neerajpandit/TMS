import mongoose, { Schema } from "mongoose";

const routestationmappingMasterSchema = new Schema({
    routeName: { type: String, required: true },
    startPoint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Station",
        required: true,
    },
    endPoint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Station",
        required: true,
    },
    stations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Station" }],
});

export const TMS_RouteStationMappingMaster = mongoose.model(
    "TMS_RouteStationMappingMaster",
    routestationmappingMasterSchema
);
