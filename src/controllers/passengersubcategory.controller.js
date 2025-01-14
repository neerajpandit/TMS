import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { TMS_PassengerMaster } from "../models/passengermaster.model.js";
import { isValidString } from "../utils/stringValidation.js";

const createPassengerSubCategory = asyncHandler(async (req, res) => {
    const { passengerMasterid } = req.params;
    if (!passengerMasterid) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger Master not found"));
    }
    const { name, description, status } = req.body;
    if (!isValidString(name) || !description || !status) {
        return res
            .status(400)
            .json(new ApiError(400, null, "All fields are required"));
    }

    const passengerMaster =
        await TMS_PassengerMaster.findById(passengerMasterid);
    if (!passengerMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger Master not found"));
    }

    const existingSubCategory = passengerMaster.passengersubcategory.find(
        (subcategory) => subcategory.name === name
    );
    if (existingSubCategory) {
        return res
            .status(409)
            .json(
                new ApiError(409, null, "Passenger SubCategory Already Exists")
            );
    }

    const newSubCategory = {
        name: passengerMaster.name + "-" + name,
        description,
        status: status || "0",
    };
    passengerMaster.passengersubcategory.push(newSubCategory);
    const updatedPassengerMaster = await passengerMaster.save();
    if (!updatedPassengerMaster) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while creating Passenger SubCategory"
                )
            );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                null,
                "passengerSubCategory",
                "Passenger SubCategory Created Successfully"
            )
        );
});

const getPassengerSubCategory = asyncHandler(async (req, res) => {
    const { passengerMasterid } = req.params;

    if (!passengerMasterid) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Passenger Master ID is required"));
    }

    const passengerMaster = await TMS_PassengerMaster.findById(
        passengerMasterid
    ).select("passengersubcategory");
    if (!passengerMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger Master not found"));
    }
    const activeSubCategories = passengerMaster.passengersubcategory
        .filter((subcategory) => subcategory.isdeleted !== "1")
        .map((subcategory) => {
            const { updatedAt, ...rest } = subcategory.toObject();
            return rest;
        });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                activeSubCategories,
                "passengerSubCategory",
                "Passenger SubCategories fetched successfully"
            )
        );
});

const updatePassengerSubCategory = asyncHandler(async (req, res) => {
    const { passengerMasterid, id } = req.params;
    if (
        !passengerMasterid ||
        !mongoose.Types.ObjectId.isValid(passengerMasterid) ||
        !id ||
        !mongoose.Types.ObjectId.isValid(id)
    ) {
        return res
            .status(400)
            .json(
                new ApiError(
                    400,
                    null,
                    "Invalid Passenger Master ID or SubCategory ID"
                )
            );
    }

    const { name, description, status } = req.body;

    const passengerMaster =
        await TMS_PassengerMaster.findById(passengerMasterid);
    if (!passengerMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger Master not found"));
    }

    const subCategory = passengerMaster.passengersubcategory.id(id);
    if (!subCategory) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger SubCategory not found"));
    }

    if (name) {
        const existingSubCategory = passengerMaster.passengersubcategory.find(
            (subCategory) => subCategory.name === name && subCategory.id !== id
        );

        if (existingSubCategory) {
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Passenger SubCategory with these details already exists"
                    )
                );
        }
    }

    subCategory.name = name || subCategory.name;
    subCategory.description = description || subCategory.description;
    subCategory.status = status || subCategory.status;

    const updatedPassengerMaster = await passengerMaster.save();
    if (!updatedPassengerMaster) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while updating Passenger SubCategory"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "passengerSubCategory",
                "Passenger SubCategory Updated Successfully"
            )
        );
});

const deletePassengerSubCategory = asyncHandler(async (req, res) => {
    const { passengerMasterid, id } = req.params;
    if (
        !passengerMasterid ||
        !mongoose.Types.ObjectId.isValid(passengerMasterid) ||
        !id ||
        !mongoose.Types.ObjectId.isValid(id)
    ) {
        return res
            .status(400)
            .json(
                new ApiError(
                    400,
                    null,
                    "Invalid Passenger Master ID or SubCategory ID"
                )
            );
    }

    const passengerMaster =
        await TMS_PassengerMaster.findById(passengerMasterid);
    if (!passengerMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger Master not found"));
    }

    const subCategory = passengerMaster.passengersubcategory.id(id);
    if (!subCategory) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Passenger SubCategory not found"));
    }

    subCategory.isdeleted = "1";
    subCategory.deletedAt = new Date();

    const updatedPassengerMaster = await passengerMaster.save();
    if (!updatedPassengerMaster) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while deleting Passenger SubCategory"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "passengerSubCategory",
                "Passenger SubCategory Deleted Successfully"
            )
        );
});

export {
    createPassengerSubCategory,
    getPassengerSubCategory,
    updatePassengerSubCategory,
    deletePassengerSubCategory,
};
