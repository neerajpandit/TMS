import { asyncHandler } from "../utils/asyncHandler.js";
import { TMS_VehicleMaster } from "../models/vehiclemaster.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TMS_TransportMaster } from "../models/transportmastr.model.js";
import { TMS_TransportSubCategory } from "../models/transportsubcategory.model.js";
import { TMS_SeatMaster } from "../models/seatmaster.model.js";
import { TMS_RouteMaster } from "../models/routemaster.model.js";
import { TMS_PassengerMaster } from "../models/passengermaster.model.js";
import mongoose from "mongoose";

export const createVehicleMaster = asyncHandler(async (req, res) => {
    try {
        const {
            fareType,
            transportType,
            transportSubType,
            vehicleUnitName,
            vehicleUnitCode,
            route,
            schedule,
            isReservation,
            passApply,
            seats,
        } = req.body;
        // Create a new vehicle instance with the request body
        const newVehicle = new TMS_VehicleMaster({
            fareType,
            transportType,
            transportSubType,
            vehicleUnitName,
            vehicleUnitCode,
            passApply,
            route,
            schedule,
            isReservation,
            seats,
        });

        // Save the vehicle to the database
        const savedVehicle = await newVehicle.save();

        // Respond with the created vehicle
        res.status(201).json({
            message: "Vehicle created successfully",
            data: savedVehicle,
        });
    } catch (error) {
        // Handle any errors that occur
        console.error("Error creating vehicle:", error);
        res.status(400).json({
            message: "Error creating vehicle",
            error: error.message,
        });
    }
});

export const creategridVehicleMaster = asyncHandler(async (req, res) => {
    try {
        const { fareType, seats } = req.body;

        // Create a response object without saving to the database
        const responseData = {
            fareType,
            seats,
        };

        return res.status(200).json(
            new ApiResponse(
                200,
                responseData,
                "vehiclegriddata",
                "Vehicle grid response retrieved successfully"
            )
        );
    } catch (error) {
        // Handle any errors that occur
        console.error("Error creating vehicle:", error);
        res.status(400).json({
            message: "Error creating vehicle grid response",
            error: error.message,
        });
    }
});


export const allmasterData = asyncHandler(async (req, res) => {
    const transportMasters = await TMS_TransportMaster.find({
        isdeleted: { $ne: 1 },
    })
        .select("_id name")
        .exec();
    const subtransportMaster = await TMS_TransportSubCategory.find({
        isdeleted: { $ne: 1 },
    })
        .select("_id name")
        .exec();
    const seatMaster = await TMS_SeatMaster.find({ isdeleted: { $ne: 1 } })
        .select("_id name")
        .exec();
    const routeMaster = await TMS_RouteMaster.find({ isdeleted: { $ne: 1 } })
        .select("_id routeName")
        .exec();
    const passengertype = await TMS_PassengerMaster.find({
        isdeleted: { $ne: 1 },
    })
        .select("id name")
        .exec();
    const passengerSubcategories = await TMS_PassengerMaster.aggregate([
        { $unwind: "$passengersubcategory" }, // Unwind the passengersubcategory array
        {
            $project: {
                _id: "$passengersubcategory._id", // Select the subcategory _id
                name: "$passengersubcategory.name", // Select the subcategory name
            },
        },
    ]);
    const responseData = {
        transport: transportMasters,
        subtransport: subtransportMaster,
        seat: seatMaster,
        route: routeMaster,
        passengerType: passengertype,
        passenger: passengerSubcategories,
    };
    // console.log(passengerMaster);
    return res.status(200).json(
        new ApiResponse(
            200,
            responseData,
            // subtransportMaster,
            "masterData",
            "Masters Data"
        )
    );
});

export const vehicleMasterList = asyncHandler(async (req, res) => {
    try {
        // Fetch vehicle data, including the schedule field
        const vehicledata = await TMS_VehicleMaster.find({})
            .populate("transportType", "name")
            .populate("transportSubType", "name")
            .populate("route", "routeName")
            .select("fareType vehicleUnitName vehicleUnitCode schedule") // Select necessary fields
            .lean();

        const modifiedVehicleData = vehicledata.map((vehicle) => ({
            ...vehicle,

            schedule: vehicle.schedule.map((daySchedule) => ({
                day: daySchedule.day,
                stations: daySchedule.stations.map((station) => ({
                    stationName: station.stationName,
                    shifts: station.shifts.map((shift) => ({
                        shiftNumber: shift.shiftNumber,
                        time: shift.time,
                    })),
                })),
            })),
        }));

        // Respond with the modified vehicle data
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    modifiedVehicleData,
                    "vehiclelist",
                    "Vehicle list fetched successfully"
                )
            );
    } catch (error) {
        console.error("Error fetching vehicle list:", error); // Log the error for debugging

        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
});

export const getvehiclemasterbyid = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const vehicledata = await TMS_VehicleMaster.findById(id)
            .populate("transportType", "name")
            .populate("transportSubType", "name")
            .populate("route", "routeName")
            .populate({
                path: "seats.seatType",
                select: "_id name",
            })
            .lean(); // Use lean for better performance with read queries

        if (!vehicledata) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
        }

        // Collect all unique passengerType IDs from all seats
        const passengerTypeIds = new Set();
        vehicledata.seats.forEach((seat) => {
            if (seat.passengerType && Array.isArray(seat.passengerType)) {
                seat.passengerType.forEach((typeId) => passengerTypeIds.add(typeId.toString()));
            }
        });

        // Fetch all passenger types at once
        const passengerTypes = await TMS_PassengerMaster.find(
            { _id: { $in: Array.from(passengerTypeIds) } },
            "_id name"
        ).lean();

        // Create a map for quick lookup
        const passengerTypeMap = {};
        passengerTypes.forEach((type) => {
            passengerTypeMap[type._id.toString()] = type;
        });

        // Manually populate passengerSubType within seats.seatDistribution
        const populatedSeats = await Promise.all(
            vehicledata.seats.map(async (seat) => {
                // Populate seatDistribution passengerSubType for each seat
                const populatedSeatDistribution = await Promise.all(
                    seat.seatDistribution.map(async (distribution) => {
                        // Find the PassengerMaster that contains the passengersubcategory with the matching _id
                        const passengerMaster = await TMS_PassengerMaster.findOne(
                            { "passengersubcategory._id": distribution.passengerSubType },
                            { "passengersubcategory.$": 1 } // Limit the result to the matching subcategory
                        );

                        // If the matching passenger subcategory is found, extract the name and _id
                        const passengerSubCategory = passengerMaster?.passengersubcategory[0];

                        return {
                            ...distribution, // No need for toObject since it's already a plain object
                            passengerSubType: passengerSubCategory
                                ? {
                                      _id: passengerSubCategory._id,
                                      name: passengerSubCategory.name,
                                  }
                                : null,
                                passApply: distribution.passApply || "Unknown",
                        };
                    })
                );

                // Populate passengerType using the map
                const populatedPassengerTypes = Array.isArray(seat.passengerType)
                ? seat.passengerType.map((typeId) => {
                      return passengerTypeMap[typeId.toString()] || { _id: typeId, name: "Unknown" };
                  })
                : []; // If it's not an array, default to an empty array
            

                return {
                    ...seat,
                    seatDistribution: populatedSeatDistribution,
                    passengerType: populatedPassengerTypes,
                };
            })
        );

        // Create the modified response structure
        const modifiedVehicleData = {
            transportType: vehicledata.transportType?.name || "Unknown",
            transportSubType: vehicledata.transportSubType?.name || "Unknown",
            route: vehicledata.route?.routeName || "Unknown",
            fareType: vehicledata.fareType || "Unknown",
            vehicleUnitName: vehicledata.vehicleUnitName || "Unknown",
            vehicleUnitCode: vehicledata.vehicleUnitCode || "Unknown",
            isReservation: vehicledata.isReservation || "Unknown",
            seats: populatedSeats,
            schedule: vehicledata.schedule?.map((daySchedule) => ({
                day: daySchedule.day || "Unknown",
                stations: daySchedule.stations?.map((station) => ({
                    stationName: station.stationName || "Unknown",
                    shifts: station.shifts?.map((shift) => ({
                        time: shift.time || "Unknown",
                    })) || [],
                })) || [],
            })) || [],
        };

        // Send the response with populated vehicle data
        return res.status(200).json(
            new ApiResponse(
                200,
                modifiedVehicleData,
                "vehiclelist",
                "Vehicle details fetched successfully"
            )
        );
    } catch (error) {
        console.error("Error fetching vehicle details:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
});


export const updateVehicleMaster = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fareType,
            transportType,
            transportSubType,
            vehicleUnitName,
            vehicleUnitCode,
            route,
            schedule,
            isReservation,
            seats,
            passApply,
        } = req.body;

        // Find the vehicle by ID and update the fields
        const updatedVehicle = await TMS_VehicleMaster.findByIdAndUpdate(
            id,
            {
                fareType,
                transportType,
                transportSubType,
                vehicleUnitName,
                vehicleUnitCode,
                route,
                schedule,
                passApply,
                isReservation,
                seats,
            },
            { new: true } 
        );

        if (!updatedVehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
            });
        }

        // Respond with the updated vehicle
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedVehicle,
                    "updateVehicleMaster",
                    "Vehicle updated successfully"
                )
            );
    } catch (error) {
        // Handle any errors that occur
        console.error("Error updating vehicle:", error);
        return res.status(500).json({
            message: "Error updating vehicle",
            error: error.message,
        });
    }
});

export const deleteVehicleMaster = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json(
                    new ApiResponse(
                        400,
                        null,
                        "Invalid ID",
                        "The provided ID is invalid"
                    )
                );
        }

        // Find the PassMaster record by ID
        const vehicleMaster = await TMS_VehicleMaster.findById(id);
        if (!vehicleMaster) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        null,
                        "Not Found",
                        "vehicleMaster record not found"
                    )
                );
        }

        // Soft delete the record
        vehicleMaster.isdeleted = 1;
        vehicleMaster.deletedAt = new Date();
        await vehicleMaster.save();

        // Return success response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Success",
                    "vehicleMaster record marked as deleted successfully"
                )
            );
    } catch (error) {
        console.log(error);

        // Return error response
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    null,
                    "Error",
                    "Error marking vehicleMaster record as deleted"
                )
            );
    }
});
