import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TMS_TransportMaster } from "../models/transportmastr.model.js";
import { TMS_TransportSubCategory } from "../models/transportsubcategory.model.js";
import mongoose from "mongoose";
import { isValidString } from "../utils/stringValidation.js";

const createTransportType = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!isValidString(name)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "All fields are required"));
    }
    const existingTransportType = await TMS_TransportMaster.findOne({
        name: name,
        isdeleted: { $ne: 1 },
    });

    if (existingTransportType) {
        return res
            .status(409)
            .json(new ApiError(409, null, "Transport Type Already Exists"));
    }

    try {
        let newTransportMaster = await TMS_TransportMaster.findOneAndUpdate(
            { name: name, isdeleted: 1 },
            { isdeleted: 0 },
            { new: true, upsert: true }
        );

        if (!newTransportMaster) {
            newTransportMaster = await TMS_TransportMaster.create({
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
                    "TransportType",
                    "Transport Type Created Successfully"
                )
            );
    } catch (error) {
        if (error.code === 11000) {
            return res
                .status(409)
                .json(new ApiError(409, null, "Transport Type Already Exists"));
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

const getTransportType = asyncHandler(async (req, res) => {
    const matchCriteria = req.transportMaster ? req.transportMaster : {};
    const criteria = {
        ...matchCriteria,
        isdeleted: { $ne: "1" },
    };
    const transportMasterAggregate = await TMS_TransportMaster.aggregate([
        { $match: criteria },
        {
            $lookup: {
                from: "tms_transportsubcategories",
                localField: "_id",
                foreignField: "transportMasterid",
                as: "subcategories",
            },
        },
        {
            $addFields: {
                // Filter out subcategories with status = "1" and calculate the count
                filteredSubcategories: {
                    $filter: {
                        input: "$subcategories",
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
        {
            $addFields: {
                Count: { $size: "$filteredSubcategories" },
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

    if (!transportMasterAggregate || transportMasterAggregate.length === 0) {
        return res
            .status(404)
            .json(
                new ApiError(
                    404,
                    null,
                    "Transport Type not found or not fetched"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transportMasterAggregate,
                "transportType",
                "Transport Type fetched successfully"
            )
        );
});

const getSubCategories = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Invalid TransportMaster ID"));
    }
    const transportMaster = await TMS_TransportMaster.findById(id);
    if (!transportMaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "TransportMaster not found"));
    }
    const subCategories = await TMS_TransportSubCategory.find({
        transportMasterid: id,
        isdeleted: { $ne: "1" },
    }).select("-transportMasterid  -updatedAt -__v -isdeleted");

    if (!subCategories || subCategories.length === 0) {
        return res
            .status(404)
            .json(
                new ApiError(
                    404,
                    null,
                    "No subcategories found for this TransportMaster"
                )
            );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subCategories,
                "subcategories",
                "Subcategories fetched successfully"
            )
        );
});

const updateTransportType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }

    const { name, status } = req.body;
    const transportType = await TMS_TransportMaster.findById(id);

    if (!transportType) {
        return res.status(404).json(new ApiError(404, null, "Transport Type Not Found"));
    }

    if (name) {
        // Check for valid string before proceeding
        if (!isValidString(name)) {
            return res.status(400).json(new ApiError(400, null, "Invalid name provided. Please write name in a valid form."));
        }

        // Check for existing transport type that is not deleted or is deleted
        const existingTransportType = await TMS_TransportMaster.findOne({
            name,
            // Allow update if found but marked as deleted
        });

        if (existingTransportType && existingTransportType.id !== id && existingTransportType.isdeleted !== "1") {
            return res.status(409).json(new ApiError(409, null, "Transport Master with this name already exists"));
        }

        // Update the name regardless of whether the existing entry is deleted
        transportType.name = name;
    }

    if (status) {
        transportType.status = status;
    }

    await transportType.save();
    return res.status(200).json(new ApiResponse(200, null, "TransportType", "Transport Master Updated Successfully"));
});



// const updateTransportType = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json(new ApiError(400, null, "ID is invalid"));
//     }

//     const { name, status } = req.body;
//     const transportType = await TMS_TransportMaster.findById(id);
//     if (!transportType) {
//         return res
//             .status(404)
//             .json(new ApiError(404, null, "Transport Type Not Found"));
//     }
//     if (name) {
//         if (!isValidString(name)) {
//             return res
//                 .status(400)
//                 .json(
//                     new ApiError(
//                         400,
//                         null,
//                         "Please write name in a valid form."
//                     )
//                 );
//         }

//         const existingTransportType = await TMS_TransportMaster.findOne({
//             name,
//         });
//         if (existingTransportType && existingTransportType.id !== id) {
//             return res
//                 .status(409)
//                 .json(
//                     new ApiError(
//                         409,
//                         null,
//                         "Transport Master with this name already exists"
//                     )
//                 );
//         }
//         transportType.name = name;
//     }
//     if (status) {
//         transportType.status = status;
//     }
//     await transportType.save();
//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 null,
//                 "TransportType",
//                 "Transport Master Updated Successfully"
//             )
//         );
// });

const deleteTransportType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }
    const transporttype = await TMS_TransportMaster.findById(id);
    if (!transporttype) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Transport Type Not Found"));
    }

    transporttype.isdeleted = 1;
    transporttype.deletedAt = new Date();
    await transporttype.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "TransportType",
                "Transport  Type Deleted Successfully"
            )
        );
});

export {
    createTransportType,
    getTransportType,
    updateTransportType,
    deleteTransportType,
    getSubCategories,
};
