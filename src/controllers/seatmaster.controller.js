import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { isValidString } from "../utils/stringValidation.js";
import { TMS_SeatMaster } from "../models/seatmaster.model.js";

const createSeatMaster = asyncHandler(async (req, res) => {
    const { name, status } = req.body;

    // Validate required fields
    if (!name || !status) {
        return res
            .status(400)
            .json(new ApiError(400, null, "All fields are required"));
    }

    if (!isValidString(name)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Name is not valid"));
    }

    // Check if a SeatMaster with the same name exists and is not deleted
    const existingSeatMaster = await TMS_SeatMaster.findOne({
        name,
        isdeleted: { $ne: 1 }, // Exclude records where isdeleted is 1
    });

    if (existingSeatMaster) {
        return res
            .status(409)
            .json(
                new ApiError(
                    409,
                    null,
                    "Seat Master with this name already exists"
                )
            );
    }

    try {
        // Update existing record if it was marked as deleted, or create a new record
        let newSeatMaster = await TMS_SeatMaster.findOneAndUpdate(
            { name, isdeleted: 1 },
            { isdeleted: 0, status },
            { new: true, upsert: true }
        );

        if (!newSeatMaster) {
            newSeatMaster = await TMS_SeatMaster.create({
                name,
                status,
                isdeleted: 0,
            });
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    null,
                    "seatMaster",
                    "Seat Master created successfully"
                )
            );
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Seat Master with this name already exists"
                    )
                );
        }
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while creating Seat Master"
                )
            );
    }
});

const getSeatMaster = asyncHandler(async (req, res) => {
    const criteria = {
        isdeleted: { $ne: "1" },
    };
    const seatmasters = await TMS_SeatMaster.find(criteria).select(
        "-updatedAt -__v -isdeleted"
    );
    if (seatmasters.length === 0) {
        return res
            .status(404)
            .json(new ApiError(404, null, "No Seat Masters found "));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                seatmasters,
                "seatmasters",
                "Seat Masters fetched successfully"
            )
        );
});
const updateSeatMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }

    const { name, status } = req.body;
    const seatMaster = await TMS_SeatMaster.findById(id);
    if (!seatMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Seat Master not found"));
    }

    if (name) {
        if (typeof name !== "string" || name.trim() === "") {
            return res
                .status(400)
                .json(new ApiError(400, null, "Invalid name"));
        }

        const existingseatMaster = await TMS_SeatMaster.findOne({ name });
        if (existingseatMaster && existingseatMaster.id !== id) {
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Seat Master with this name already exists"
                    )
                );
        }
        seatMaster.name = name;
    }

    if (status) {
        seatMaster.status = status;
    }

    const updatedSeatMaster = await seatMaster.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "seatMaster",
                "Seat Master updated successfully"
            )
        );
});

const deleteSeatMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }
    const seatmaster = await TMS_SeatMaster.findById(id);
    if (!seatmaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Seat Master Not Found"));
    }

    seatmaster.isdeleted = 1;
    seatmaster.deletedAt = new Date();
    await seatmaster.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "seatmaster ",
                "Seat Master Deleted Successfully"
            )
        );
});

export { createSeatMaster, getSeatMaster, updateSeatMaster, deleteSeatMaster };
