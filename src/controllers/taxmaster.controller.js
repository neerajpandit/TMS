import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { TMS_TaxMaster } from "../models/taxmaster.model.js";
import { isValidDecimal } from "../utils/stringValidation.js";

const createTaxMaster = asyncHandler(async (req, res) => {
    const { name, taxPercentage, status } = req.body;

    // Validate required fields
    if (!name || !taxPercentage || !status) {
        return res
            .status(400)
            .json(new ApiError(400, null, "All fields are required"));
    }

    // Validate field types
    if (
        typeof name !== "string" ||
        name.trim() === "" ||
        !isValidDecimal(taxPercentage)
    ) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Invalid name or tax percentage"));
    }

    // Check if tax master with the same name exists and is not deleted
    const existingTaxMaster = await TMS_TaxMaster.findOne({
        name,
        isdeleted: { $ne: 1 }, // Exclude records where isdeleted is 1
    });

    if (existingTaxMaster) {
        return res
            .status(409)
            .json(
                new ApiError(
                    409,
                    null,
                    "Tax Master with this name already exists"
                )
            );
    }

    try {
        // Update existing record if it was marked as deleted, or create a new record
        let newTaxMaster = await TMS_TaxMaster.findOneAndUpdate(
            { name, isdeleted: 1 },
            { isdeleted: 0, taxPercentage, status },
            { new: true, upsert: true }
        );

        if (!newTaxMaster) {
            newTaxMaster = await TMS_TaxMaster.create({
                name,
                taxPercentage,
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
                    "taxMaster",
                    "Tax Master created successfully"
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
                        "Tax Master with this name already exists"
                    )
                );
        }
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while creating Tax Master"
                )
            );
    }
});

const getTaxMaster = asyncHandler(async (req, res) => {
    const criteria = {
        isdeleted: { $ne: "1" },
    };
    const taxmasters = await TMS_TaxMaster.find(criteria).select(
        "-updatedAt -__v -isdeleted"
    );
    if (taxmasters.length === 0) {
        return res
            .status(404)
            .json(
                new ApiError(
                    404,
                    null,
                    "No Tax Masters found or all have been deleted"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                taxmasters,
                "taxmasters",
                "Tax Masters fetched successfully"
            )
        );
});

const updateTaxMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }

    const { name, taxPercentage, status } = req.body;
    const taxMaster = await TMS_TaxMaster.findById(id);
    if (!taxMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Tax Master not found"));
    }

    if (name) {
        if (typeof name !== "string" || name.trim() === "") {
            return res
                .status(400)
                .json(new ApiError(400, null, "Invalid name"));
        }

        const existingTaxMaster = await TMS_TaxMaster.findOne({ name });
        if (existingTaxMaster && existingTaxMaster.id !== id) {
            return res
                .status(409)
                .json(
                    new ApiError(
                        409,
                        null,
                        "Tax Master with this name already exists"
                    )
                );
        }
        taxMaster.name = name;
    }

    if (taxPercentage) {
        if (!isValidDecimal(taxPercentage)) {
            return res
                .status(400)
                .json(new ApiError(400, null, "Invalid tax percentage"));
        }
        taxMaster.taxPercentage = taxPercentage;
    }

    if (status) {
        taxMaster.status = status;
    }

    const updatedTaxMaster = await taxMaster.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "taxMaster",
                "Tax Master updated successfully"
            )
        );
});

const deleteTaxMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }
    const taxmaster = await TMS_TaxMaster.findById(id);
    if (!taxmaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Tax Master Not Found"));
    }

    taxmaster.isdeleted = 1;
    taxmaster.deletedAt = new Date();
    await taxmaster.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Taxmaster ",
                "Tax Master Deleted Successfully"
            )
        );
});

export { createTaxMaster, getTaxMaster, updateTaxMaster, deleteTaxMaster };
