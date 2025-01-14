import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { TMS_PassengerMaster } from "../models/passengermaster.model.js";
import { isValidString } from "../utils/stringValidation.js";

const createPassengerMaster = asyncHandler(async (req, res) => {
    const { name } = req.body;

    // Validate the name field
    if (!isValidString(name)) {
        return res
            .status(400)
            .json(
                new ApiError(
                    400,
                    null,
                    "Name field is required and must be a valid string"
                )
            );
    }

    // Check if a passenger master with the same name exists and is not deleted
    const existingPassengerMaster = await TMS_PassengerMaster.findOne({
        name,
        isdeleted: { $ne: 1 }, // Exclude records where isdeleted is 1
    });

    if (existingPassengerMaster) {
        return res
            .status(409)
            .json(
                new ApiError(
                    409,
                    null,
                    "Passenger Master with this name already exists"
                )
            );
    }

    try {
        // Update existing record if it was marked as deleted, or create a new record
        let newPassengerMaster = await TMS_PassengerMaster.findOneAndUpdate(
            { name, isdeleted: 1 },
            { isdeleted: 0 },
            { new: true, upsert: true }
        );

        if (!newPassengerMaster) {
            newPassengerMaster = await TMS_PassengerMaster.create({
                name,
                isdeleted: 0,
            });
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    null,
                    "PassengerMaster",
                    "Passenger Master Created Successfully"
                )
            );
    } catch (error) {
        if (error.code === 11000) {
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Passenger Master with this name already exists"
                    )
                );
        }
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while creating Passenger Master"
                )
            );
    }
});

const getPassengerMaster = asyncHandler(async (req, res) => {
    const matchCriteria = req.passengerMaster ? req.passengerMaster : {};
    const criteria = {
        ...matchCriteria,
        isdeleted: { $ne: "1" },
    };
    const passengerMasterAggregate = await TMS_PassengerMaster.aggregate([
        { $match: criteria },
        {
            $addFields: {
                Count: {
                    $size: {
                        $filter: {
                            input: "$passengersubcategory",
                            as: "subcategory",
                            cond: {
                                $and: [
                                    { $ne: ["$$subcategory.status", "1"] },
                                    { $ne: ["$$subcategory.isdeleted", "1"] },
                                ],
                            },
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                Count: 1,
            },
        },
    ]);

    if (!passengerMasterAggregate || passengerMasterAggregate.length === 0) {
        return res
            .status(404)
            .json(
                new ApiError(
                    404,
                    null,
                    "Passenger Master not found or not fetched"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                passengerMasterAggregate,
                "passenger",
                "Passenger Master fetched successfully"
            )
        );
});

const updatePassengerMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }

    const { name, status } = req.body;

    const passengerMaster = await TMS_PassengerMaster.findById(id);
    if (!passengerMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger Master Not Found"));
    }

    // If the name is provided, validate it and check for duplicates
    if (name) {
        if (!isValidString(name)) {
            return res
                .status(400)
                .json(new ApiError(400, null, "Please provide a valid name."));
        }

        const existingPassengerMaster = await TMS_PassengerMaster.findOne({
            name: name,
        });
        if (existingPassengerMaster && existingPassengerMaster.id !== id) {
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Passenger Master with this name already exists"
                    )
                );
        }
    }

    // Update the fields if they are provided
    passengerMaster.name = name || passengerMaster.name;
    passengerMaster.status = status || passengerMaster.status;

    await passengerMaster.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "PassengerMaster",
                "Passenger Master Updated Successfully"
            )
        );
});

const deletePassengerMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }
    const passengerMaster = await TMS_PassengerMaster.findById(id);
    if (!passengerMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger Master Not Found"));
    }
    passengerMaster.isdeleted = 1;
    passengerMaster.deletedAt = new Date();
    await passengerMaster.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "passengerMaster",
                "passengerMaster Deleted Successfully"
            )
        );
});

export {
    createPassengerMaster,
    getPassengerMaster,
    updatePassengerMaster,
    deletePassengerMaster,
};
