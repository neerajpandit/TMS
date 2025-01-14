import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import { TMS_TransportMaster } from "../models/transportmastr.model.js";
import { TMS_StationMaster } from "../models/stationmaster.model.js";
import mongoose from "mongoose";

// const createStationMaster = asyncHandler(async (req, res) => {
//     const { name, longitude, latitude, stationCode, status } = req.body;

//     // Validate required fields
//     if (
//         [name, longitude, latitude, stationCode, status].some(
//             (field) => field?.trim() === ""
//         )
//     ) {
//         return res
//             .status(400)
//             .json(new ApiError(400, null, "All fields are required"));
//     }

//     // Check if a station with the same name exists and is not deleted
//     const existingStationMaster = await TMS_StationMaster.findOne({
//         name,
//         isdeleted: { $ne: 1 }, // Exclude records where isdeleted is 1
//     });
//     if (existingStationMaster) {
//         return res
//             .status(409)
//             .json(new ApiError(409, null, "Station Master Already Exists"));
//     }

//     try {
//         // Update existing record if it was marked as deleted, or create a new record
//         let newStationMaster = await TMS_StationMaster.findOneAndUpdate(
//             { name, isdeleted: 1 },
//             { isdeleted: 0, longitude, latitude, stationCode, status },
//             { new: true, upsert: true }
//         );

//         if (!newStationMaster) {
//             newStationMaster = await TMS_StationMaster.create({
//                 name,
//                 longitude,
//                 latitude,
//                 stationCode,
//                 status,
//                 isdeleted: 0,
//             });
//         }

//         return res
//             .status(201)
//             .json(
//                 new ApiResponse(
//                     201,
//                     newStationMaster,
//                     "StationMaster",
//                     "Station Created Successfully"
//                 )
//             );
//     } catch (error) {
//         return res
//             .status(500)
//             .json(
//                 new ApiError(
//                     500,
//                     null,
//                     "Something went wrong while creating Station Master"
//                 )
//             );
//     }
// });

const createStationMaster = asyncHandler(async (req, res) => {
    const { name, longitude, latitude, stationCode, status } = req.body;
    if (
        [name, longitude, latitude, stationCode, status].some(
            (field) => field?.trim() === ""
        )
    ) {
        return res
            .status(400)
            .json(new ApiError(400, null, "All fields  are required"));
    }

    const existingStationMaster = await TMS_StationMaster.findOne({
        name: name,
    });
    if (existingStationMaster) {
        return res
            .status(409)
            .json(new ApiError(409, null, "Station Master Already Exists"));
    }
    const newStationMaster = await TMS_StationMaster.create({
        name,
        longitude,
        latitude,
        stationCode,
        status,
    });
    if (!newStationMaster) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    newStationMaster,
                    "Something went wrong while creating Transport Type"
                )
            );
    }
    //yeah ishliye used kiya agr ki field json me nhi chhaiye toh '-minus kr de '
    // const transportMaster = await TMS_TransportMaster.findById(newTransportMaster._id).select('-createdAt');
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                null,
                "StationMaster",
                "Station Created Successfully"
            )
        );
});

const getStationMaster = asyncHandler(async (req, res) => {
    const criteria = {
        isdeleted: { $ne: "1" },
    };
    const station = await TMS_StationMaster.find(criteria).select(
        " -isdeleted -createdAt -updatedAt -__v"
    );
    console.log(station);

    if (!station) {
        return res
            .status(400)
            .json(new ApiError(400, station, "All Station Fetch Successfully"));
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                station,
                "StationMaster",
                "Station List Fetched Successfully"
            )
        );
});

const deleteStationMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }
    const station = await TMS_StationMaster.findById(id);
    if (!station) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Station Not Found"));
    }

    station.isdeleted = 1;
    station.deletedAt = new Date();
    await station.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "StationMaster",
                "StationMaster Deleted Successfully"
            )
        );
});

const updateStationMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }

    const { name, longitude, latitude, stationCode, status } = req.body;
    const staionmaster = await TMS_StationMaster.findById(id);
    if (!staionmaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Station Not Found"));
    }
    const station = await TMS_StationMaster.findByIdAndUpdate(
        id,
        {
            $set: {
                name: name,
                longitude: longitude,
                latitude: latitude,
                stationCode: stationCode,
                status: status,
            },
        },
        { new: true }
    );
    // if (name) {
    //     if (!isValidString(name)) {
    //         return res
    //             .status(400)
    //             .json(
    //                 new ApiError(
    //                     400,
    //                     null,
    //                     "Please write name in a valid form."
    //                 )
    //             );
    //     }

    //     const existingstaionmaster = await TMS_TransportMaster.findOne({
    //         name,
    //     });
    //     if (existingstaionmaster && existingstaionmaster.id !== id) {
    //         return res
    //             .status(409)
    //             .json(
    //                 new ApiError(
    //                     409,
    //                     null,
    //                     "Transport Master with this name already exists"
    //                 )
    //             );
    //     }
    //     staionmaster.name = name;
    // }
    // if (status) {
    //     staionmaster.status = status;
    // }
    // await staionmaster.save();
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "staionmaster",
                "Station Master Updated Successfully"
            )
        );
});

export {
    createStationMaster,
    getStationMaster,
    deleteStationMaster,
    updateStationMaster,
};
