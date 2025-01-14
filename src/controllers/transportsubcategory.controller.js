import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TMS_TransportSubCategory } from "../models/transportsubcategory.model.js";
import { TMS_TransportMaster } from "../models/transportmastr.model.js";
import mongoose from "mongoose";
import { generateRandomID } from "../utils/randomNumber.js";
import { isValidString, areValidStrings } from "../utils/stringValidation.js";

const createTransportsubcategoryType = asyncHandler(async (req, res) => {
    const { transportMasterid } = req.params;
    const { name, status } = req.body;

    // Validate transportMasterid
    if (
        !transportMasterid ||
        !mongoose.Types.ObjectId.isValid(transportMasterid)
    ) {
        return res
            .status(400)
            .json(new ApiError(400, null, "TransportMasterid is invalid"));
    }

    // Check if TransportMaster exists
    const transportmaster =
        await TMS_TransportMaster.findById(transportMasterid);
    if (!transportmaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Transport Master not found"));
    }

    // Validate name and status
    if (!areValidStrings(name, status)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "All fields are required"));
    }

    try {
        // Check if a deleted record with the same name and transportMasterid exists
        let transportsubcategory = await TMS_TransportSubCategory.findOne({
            transportMasterid: transportMasterid, // Check within the same transportMasterid
            name: name, // Check if the name already exists within this transportMasterid
            isdeleted: 1,
        });

        if (transportsubcategory) {
            // Reactivate the deleted record
            transportsubcategory.isdeleted = 0;
            transportsubcategory.status = status; // Update the status if necessary
            await transportsubcategory.save();
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        null,
                        "TransportSubCategory",
                        "Transport Sub Category Reactivated Successfully"
                    )
                );
        }

        // Check if an active record with the same name and transportMasterid exists
        transportsubcategory = await TMS_TransportSubCategory.findOne({
            transportMasterid: transportMasterid, // Check within the same transportMasterid
            name: name, // Check if the name already exists within this transportMasterid
            isdeleted: 0,
        });

        if (transportsubcategory) {
            // If an active record is found within the same transportMasterid, return a conflict response
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Transport Sub Category Already Exists"
                    )
                );
        }

        // If no record exists within the same transportMasterid, create a new one
        const transportID = await generateRandomID();
        transportsubcategory = await TMS_TransportSubCategory.create({
            name,
            transportID,
            status,
            transportMasterid,
            isdeleted: 0,
        });

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    null,
                    "TransportSubCategory",
                    "Transport Sub Category Created Successfully"
                )
            );
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate key error
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Transport Sub Category Already Exists"
                    )
                );
        }
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while creating Transport Sub Category"
                )
            );
    }
});

const getTransportsubcategoryType = asyncHandler(async (req, res) => {
    const criteria = {
        ...req.transportsubcategory,
        isdeleted: { $ne: "1" },
    };
    const transportsubcategory = await TMS_TransportSubCategory.find(
        criteria
    ).select("-transportMasterid  -updatedAt -__v -isdeleted");
    if (!transportsubcategory) {
        return res
            .status(404)
            .json(
                new ApiError(
                    404,
                    null,
                    "Transport SubCategory not found or not fetched"
                )
            );
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transportsubcategory,
                "transportSubCategory",
                "Transport SubCategory fetched successfully"
            )
        );
});

const updateTransportsubcategoryType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }

    const { name, status } = req.body;

    const transortsubcategoryType = await TMS_TransportSubCategory.findById(id);
    if (!transortsubcategoryType) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Transport SubCategory Not Found"));
    }
    if (name) {
        if (!isValidString(name)) {
            return res
                .status(400)
                .json(
                    new ApiError(
                        400,
                        null,
                        "Please write name in a valid form."
                    )
                );
        }
        const existingTransportSubCategory =
            await TMS_TransportSubCategory.findOne({
                name: name,
            });
        if (
            existingTransportSubCategory &&
            existingTransportSubCategory.id !== id
        ) {
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Transport SubCategory with these name already exists"
                    )
                );
        }
    }

    transortsubcategoryType.name = name || transortsubcategoryType.name;
    transortsubcategoryType.status = status || transortsubcategoryType.status;
    await transortsubcategoryType.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Transport SubCategory",
                "Transport SubCategory Updated Successfully"
            )
        );
});

const deleteTransportsubcategoryType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }
    const transortsubcategoryType = await TMS_TransportSubCategory.findById(id);
    if (!transortsubcategoryType) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Transport Sub Category Not Found"));
    }
    transortsubcategoryType.isdeleted = 1;
    transortsubcategoryType.deletedAt = new Date();
    await transortsubcategoryType.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Transport SubCategory",
                "Transport Sub Category Deleted Successfully"
            )
        );
});
export {
    createTransportsubcategoryType,
    updateTransportsubcategoryType,
    deleteTransportsubcategoryType,
    getTransportsubcategoryType,
};
