import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { TMS_KioskMaster } from "../models/kioskmaster.model.js";
import mongoose from "mongoose";
import {
    isValidCode,
    areValidStrings,
    ValidString,
} from "../utils/stringValidation.js";

export const createKioskMaster = asyncHandler(async (req, res) => {
    const { name, location, code } = req.body;

    if (!name || !location || !code) {
        return res
            .status(400)
            .json(new ApiError(400, null, "All fields are required"));
    }

    if (!areValidStrings(name, location)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Name or location are required"));
    }
    if (!isValidCode(code)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Code must be a non-empty string without spaces or special characters"));
    }
    const existingkioskmaster = await TMS_KioskMaster.findOne({
        name: name,
        location: location,
        code: code,
        isdeleted: { $ne: 1 },
    });

    if (existingkioskmaster) {
        return res
            .status(409)
            .json(new ApiError(409, null, "Kiosk Master Already Exists"));
    }

    try {
        let newKioskMaster = await TMS_KioskMaster.findOneAndUpdate(
            { name: name, location: location, code: code, isdeleted: 1 },
            { isdeleted: 0 },
            { new: true, upsert: true }
        );

        if (!newKioskMaster) {
            newKioskMaster = await TMS_KioskMaster.create({
                name,
                location,
                code,
                isdeleted: 0,
            });
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    null,
                    "KioskMaster",
                    "Kiosk Master Created Successfully"
                )
            );
    } catch (error) {
        if (error.code === 11000) {
            return res
                .status(409)
                .json(new ApiError(409, null, "Kiosk Master Already Exists"));
        }
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while creating Transport Type"
                )
            );
    }
});

export const getKioskMaster = asyncHandler(async (req, res) => {
    const { id } = req.params; // Optional: If you want to fetch a specific KioskMaster by ID

    try {
        // If an ID is provided, fetch the specific KioskMaster by ID
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res
                    .status(400)
                    .json(new ApiError(400, null, "Invalid KioskMaster ID"));
            }

            const kioskMaster = await TMS_KioskMaster.findOne({
                _id: id,
                isdeleted: { $ne: 1 }, // Ensure the kiosk master is not marked as deleted
            });

            if (!kioskMaster) {
                return res
                    .status(404)
                    .json(new ApiError(404, null, "Kiosk Master Not Found"));
            }

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        kioskMaster,
                        "KioskMaster",
                        "Kiosk Master fetched successfully"
                    )
                );
        }

        // If no ID is provided, fetch all KioskMasters that are not deleted
        const kioskMasters = await TMS_KioskMaster.find({
            isdeleted: { $ne: 1 }, // Ensure not fetching deleted kiosk masters
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    kioskMasters,
                    "KioskMasters",
                    "Kiosk Masters fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while fetching Kiosk Masters"
                )
            );
    }
});

export const getKioskMasterList = asyncHandler(async (req, res) => {
    try {
        const kioskMasters = await TMS_KioskMaster.find({
            isdeleted: { $ne: 1 },
        }).select("-__v -createdAt -updatedAt");
        if (!kioskMasters.length) {
            return res
                .status(404)
                .json(new ApiError(404, null, "No Kiosk Masters found"));
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    kioskMasters,
                    "KioskMasterList",
                    "Kiosk Masters fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while fetching Kiosk Masters"
                )
            );
    }
});

export const updateKioskMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, location, code } = req.body;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Invalid KioskMaster ID"));
    }

    // Check if the KioskMaster exists and is not deleted
    const kioskMaster = await TMS_KioskMaster.findOne({
        _id: id,
        isdeleted: { $ne: 1 },
    });

    if (!kioskMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Kiosk Master Not Found"));
    }

    // Update the KioskMaster
    try {
        const updatedKioskMaster = await TMS_KioskMaster.findByIdAndUpdate(
            id,
            { name, location, code },
            { new: true }
        );
        if (!areValidStrings(name, location)) {
            return res
                .status(400)
                .json(new ApiError(400, null, "Name or Location are required"));
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedKioskMaster,
                    "KioskMaster",
                    "Kiosk Master updated successfully"
                )
            );
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while updating Kiosk Master"
                )
            );
    }
});

export const deleteKioskMaster = asyncHandler(async (req, res) => {
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

        // Find the KioskMaster record by ID
        const kioskMaster = await TMS_KioskMaster.findById(id);
        if (!kioskMaster) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        null,
                        "Not Found",
                        "Kiosk Master record not found"
                    )
                );
        }

        // Soft delete the record
        kioskMaster.isdeleted = 1;
        kioskMaster.deletedAt = new Date();
        await kioskMaster.save();

        // Return success response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Success",
                    "Kiosk Master record marked as deleted successfully"
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
                    "Error marking Kiosk Master record as deleted"
                )
            );
    }
});
