import { TMS_PassengerMaster } from "../models/passengermaster.model.js";
import { TMS_PassMaster } from "../models/passmaster.model.js";
import { TMS_SeatMaster } from "../models/seatmaster.model.js";
import { TMS_TaxMaster } from "../models/taxmaster.model.js";
import { TMS_TransportMaster } from "../models/transportmastr.model.js";
import { TMS_TransportSubCategory } from "../models/transportsubcategory.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const definepassPrice = asyncHandler(async (req, res) => {
    const {
        transporttypeId,
        transportsubTypeId,
        seattypeId,
        passengersubTypeid,
        Gst,
        gstTypeId,
        passType,
    } = req.body;

    try {
        const transportType = await TMS_TransportMaster.findById(
            transporttypeId
        )
            .select("_id name")
            .exec();

        const transportsubType = await TMS_TransportSubCategory.findById(
            transportsubTypeId
        )
            .select("_id name")
            .exec();

        const seatTypes = await TMS_SeatMaster.find({
            _id: { $in: seattypeId },
        })
            .select("_id name")
            .exec();

        const passenger = await TMS_PassengerMaster.aggregate([
            { $unwind: "$passengersubcategory" },
            {
                $match: {
                    "passengersubcategory._id": {
                        $in: passengersubTypeid.map(
                            (id) => new mongoose.Types.ObjectId(id)
                        ),
                    },
                },
            },
            {
                $project: {
                    _id: "$passengersubcategory._id",
                    name: "$passengersubcategory.name",
                },
            },
        ]);

        // Fetch GST type details only if Gst is "Include"
        let gstType = null;
        if (Gst === "Include") {
            gstType = await TMS_TaxMaster.findById(gstTypeId)
                .select("_id name taxPercentage")
                .exec();
        }

        let responseData;
        responseData = {
            transportType: {
                _id: transportType._id,
                name: transportType.name,
            },
            transportSubType: {
                _id: transportsubType._id,
                name: transportsubType.name,
            },
            seatTypes: seatTypes.map((seat) => ({
                _id: seat._id,
                name: seat.name,
            })),
            passengerSubTypes: passenger.map((passenger) => ({
                _id: passenger._id,
                name: passenger.name,
            })),
            Gst, // GST status, either "Include" or "Exclude"
            passType: passType.map((pass) => pass),
            prices: seatTypes.map((seat) => ({
                seatType: {
                    _id: seat._id,
                    name: seat.name,
                },
                passType: passType.map((pass) => ({
                    passType: pass,
                    passengerSubTypes: passenger.map((passenger) => ({
                        passengerType: {
                            _id: passenger._id,
                            name: passenger.name,
                        },
                        fare: 1, // Replace with real fare logic
                        gst:
                            Gst === "Include" && gstType
                                ? parseFloat(
                                      (
                                          (1 * gstType.taxPercentage) /
                                          100
                                      ).toFixed(2)
                                  )
                                : 0, // GST calculation only if Gst is "Include"
                        totalprice:
                            Gst === "Include" && gstType
                                ? 1 +
                                  parseFloat(
                                      (
                                          (1 * gstType.taxPercentage) /
                                          100
                                      ).toFixed(2)
                                  )
                                : 1, // Total price if GST is included, else just fare
                    })),
                })),
            })),
        };

        // Add gstType details to response only if GST is "Include"
        if (Gst === "Include" && gstType) {
            responseData.gstType = {
                _id: gstType._id,
                name: gstType.name,
                value: gstType.taxPercentage,
            };
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    responseData,
                    "priceData",
                    "Price data with respective names"
                )
            );
    } catch (error) {
        console.log(error);

        return res
            .status(400)
            .json(new ApiResponse(400, null, "Error", "Something went wrong"));
    }
});

export const createPassMaster = asyncHandler(async (req, res) => {
    const {
        transportType,
        transportSubType,
        seatTypes,
        passengerSubTypes,
        Gst,
        gstType,
        passType,
        prices,
    } = req.body;

    const passmaster = new TMS_PassMaster({
        transportType,
        transportSubType,
        seatTypes,
        passengerSubTypes,
        Gst,
        gstType,
        passType,
        prices,
    });

    await passmaster.save();
    res.status(201).json({
        success: true,
        data: passmaster,
    });
});



// export const allpassmaster = asyncHandler(async (req, res) => {
//     try {
//         // Fetch data from various collections
//         const transportMasters = await TMS_TransportMaster.find({
//             isdeleted: { $ne: 1 },
//         })
//             .select("_id name")
//             .exec();
//         const subtransportMaster = await TMS_TransportSubCategory.find({
//             isdeleted: { $ne: 1 },
//         })
//             .select("_id name")
//             .exec();
//         const seatMaster = await TMS_SeatMaster.find({ isdeleted: { $ne: 1 } })
//             .select("_id name")
//             .exec();

//         const passengerSubcategories = await TMS_PassengerMaster.aggregate([
//             { $unwind: "$passengersubcategory" }, // Unwind the passengersubcategory array
//             // { $match: { "passengersubcategory.isdeleted": { $ne: 1 } } },
//             {
//                 $project: {
//                     _id: "$passengersubcategory._id", // Select the subcategory _id
//                     name: "$passengersubcategory.name", // Select the subcategory name
//                 },
//             },
//         ]);
//         const taxMaster = await TMS_TaxMaster.find({ isdeleted: { $ne: 1 } })
//             .select("_id name")
//             .exec();

//             const passTypeMap = {
//                 "1": "Daily",
//                 "2": "Monthly",
//                 "3": "Quarterly",
//                 "4": "6 Months",
//                 "5": "Yearly"
//             };

//         const responseData = {
//             transport: transportMasters,
//             subtransport: subtransportMaster,
//             seat: seatMaster,

//             passenger: passengerSubcategories,
//             gst: taxMaster,
//            pass: Object.values(passTypeMap), 
//             // routes: routeData,
//             // Add more as needed...
//         };

//         // Return success response
//         return res
//             .status(200)
//             .json(
//                 new ApiResponse(
//                     200,
//                     responseData,
//                     "masterData",
//                     "All PassMaster data retrieved successfully"
//                 )
//             );
//     } catch (error) {
//         console.log(error);

//         // Return error response
//         return res
//             .status(500)
//             .json(
//                 new ApiResponse(
//                     500,
//                     null,
//                     "Error",
//                     "Error retrieving PassMaster data"
//                 )
//             );
//     }
// });

export const allpassmaster = asyncHandler(async (req, res) => {
    try {
        // Fetch data from various collections
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

        const passengerSubcategories = await TMS_PassengerMaster.aggregate([
            { $unwind: "$passengersubcategory" }, // Unwind the passengersubcategory array
            // { $match: { "passengersubcategory.isdeleted": { $ne: 1 } } },
            {
                $project: {
                    _id: "$passengersubcategory._id", // Select the subcategory _id
                    name: "$passengersubcategory.name", // Select the subcategory name
                },
            },
        ]);
        const taxMaster = await TMS_TaxMaster.find({ isdeleted: { $ne: 1 } })
            .select("_id name")
            .exec();
        const responseData = {
            transport: transportMasters,
            subtransport: subtransportMaster,
            seat: seatMaster,

            passenger: passengerSubcategories,
            gst: taxMaster,
            pass: ["Daily", "Monthly", "Quarterly", "6 Months", "Yearly"],
            // routes: routeData,
            // Add more as needed...
        };

        // Return success response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    responseData,
                    "masterData",
                    "All PassMaster data retrieved successfully"
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
                    "Error retrieving PassMaster data"
                )
            );
    }
});

// export const getPassMasterById = asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     try {
//         const passMaster = await TMS_PassMaster.findById(id).exec();

//         if (!passMaster) {
//             return res
//                 .status(404)
//                 .json(
//                     new ApiResponse(
//                         404,
//                         null,
//                         "Not Found",
//                         "PassMaster not found"
//                     )
//                 );
//         }

//         return res
//             .status(200)
//             .json(
//                 new ApiResponse(
//                     200,
//                     passMaster,
//                     "PassMasterData",
//                     "PassMaster data fetched successfully"
//                 )
//             );
//     } catch (error) {
//         console.log(error);
//         return res
//             .status(500)
//             .json(new ApiResponse(500, null, "Error", "Server Error"));
//     }
// });


export const getPassMasterById1= asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Find the pass master by ID and populate the required fields
        const passMaster = await TMS_PassMaster.findById(id)
            .populate('transportType', 'name') // Populate transportType field with only the name
            .populate('transportSubType', 'name') // Populate transportSubType field with only the name
            .populate('seatTypes', 'name') // Populate seatTypes field with only the name
            .populate('passengerSubTypes', 'name') // Populate passengerSubTypes field with only the name
            .populate('gstType', 'name taxPercentage') // Populate gstType field with name and taxPercentage
            .exec();

        // If passMaster is not found, return 404
        if (!passMaster) {
            return res.status(404).json(
                new ApiResponse(404, null, 'Not Found', 'PassMaster not found')
            );
        }

        // Structuring the response according to your requirement
        const formattedResponse = {
            _id: passMaster._id,
            transportType: passMaster.transportType ? passMaster.transportType.name : "N/A", // Handle undefined transportType
            transportSubType: passMaster.transportSubType ? passMaster.transportSubType.name : "N/A", // Handle undefined transportSubType
            seatTypes: passMaster.seatTypes.map((seat) => ({
                _id: seat._id,
                name: seat.name,
            })),
            passengerSubTypes: passMaster.passengerSubTypes.map((passenger) => ({
                _id: passenger._id,
                name: passenger.name,
            })),
            Gst: passMaster.Gst,
            gstType: passMaster.gstType ? {
                _id: passMaster.gstType._id,
                name: passMaster.gstType.name,
                taxPercentage: passMaster.gstType.taxPercentage,
            } : null, // If GST type exists
            passType: passMaster.passType,
            prices: passMaster.prices, // Assuming prices field is already structured
            status: passMaster.status,
        };

        // Return the formatted response with a 200 status
        return res.status(200).json(
            new ApiResponse(200, formattedResponse, 'PassMaster Data', 'PassMaster data fetched successfully')
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiResponse(500, null, 'Error', 'Server Error'));
    }
});

export const getPassMasterById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Find the PassMaster by ID and populate the required fields
        const passMaster = await TMS_PassMaster.findById(id)
            .populate('transportType', 'name')
            .populate('transportSubType', 'name')
            .populate('seatTypes', 'name')
            .populate('gstType', 'name taxPercentage')
            .exec();

        // If passMaster is not found, return 404
        if (!passMaster) {
            return res.status(404).json(
                new ApiResponse(404, null, 'Not Found', 'PassMaster not found')
            );
        }

        // Fetch the passengerSubTypes with name and id
        const formattedPrices = await Promise.all(
            passMaster.prices.map(async (priceItem) => {
                const updatedPassType = await Promise.all(
                    priceItem.passType.map(async (passTypeItem) => {
                        const updatedPassengerSubTypes = await Promise.all(
                            passTypeItem.passengerSubTypes.map(async (subType) => {
                                // Fetch the passenger type details
                                const passengerMaster = await TMS_PassengerMaster.findOne(
                                    { 'passengersubcategory._id': subType.passengerType },
                                    { 'passengersubcategory.$': 1 }
                                );

                                const passengerSubCategory = passengerMaster?.passengersubcategory[0];

                                return {
                                    passengerType: passengerSubCategory
                                        ? {
                                              _id: passengerSubCategory._id,
                                              name: passengerSubCategory.name,
                                          }
                                        : { _id: subType.passengerType, name: 'N/A' },
                                    fare: subType.fare,
                                    gst: subType.gst,
                                    totalprice: subType.totalprice,
                                    _id: subType._id,
                                };
                            })
                        );

                        return {
                            passType: passTypeItem.passType,
                            passengerSubTypes: updatedPassengerSubTypes,
                            _id: passTypeItem._id,
                        };
                    })
                );

                // Include seat type name along with its ID
                const seatTypeDetails = await TMS_SeatMaster.findById(priceItem.seatTypes);

                return {
                    seatTypes: {
                        _id: seatTypeDetails._id,
                        name: seatTypeDetails.name,
                    },
                    passType: updatedPassType,
                    _id: priceItem._id,
                };
            })
        );

        // Structuring the response according to your requirement
        const formattedResponse = {
            _id: passMaster._id,
            transportType: passMaster.transportType
            ? {
                _id: passMaster.transportType._id,
                name: passMaster.transportType.name
              }
            : { _id: null, name: 'N/A' },
        transportSubType: passMaster.transportSubType
            ? {
                _id: passMaster.transportSubType._id,
                name: passMaster.transportSubType.name
              }
            : { _id: null, name: 'N/A' },
            seatTypes: passMaster.seatTypes.map((seat) => ({
                _id: seat._id,
                name: seat.name,
            })),
            Gst: passMaster.Gst,
            gstType: passMaster.gstType
                ? {
                      _id: passMaster.gstType._id,
                      name: passMaster.gstType.name,
                      taxPercentage: passMaster.gstType.taxPercentage,
                  }
                : null,
            passType: passMaster.passType,
            prices: formattedPrices, // Updated prices with passengerType details
            status: passMaster.status,
        };

        // Return the formatted response with a 200 status
        return res.status(200).json(
            new ApiResponse(200, formattedResponse, 'PassMasterData', 'PassMaster data fetched successfully')
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiResponse(500, null, 'Error', 'Server Error'));
    }
});





export const passMasterList = asyncHandler(async (req, res) => {
    try {
        const ticketPass = await TMS_PassMaster.find({})
            .populate("transportType", "name") // Assuming transportType has a 'name' field
            .populate("transportSubType", "name") // Assuming transportSubType has a 'name' field
            .populate("seatTypes", "seatType") // Assuming seatTypes has a 'seatType' field

            .populate("passengerSubTypes", "passengerType") // Assuming passengerSubTypes has a 'passengerType' field
            .populate("gstType", "name") // Assuming gstType has a 'taxName' field
            .select(
                "passType transportType transportSubType seatTypes passengerSubTypes route Gst name status"
            );
        // .lean();
        // console.log(ticketPrices[0].route.routeName);

        // Add custom fields for no of seatTypes and no of passengerTypes
        const passengerSubcategories = await TMS_PassengerMaster.aggregate([
            { $unwind: "$passengersubcategory" }, // Unwind the passengersubcategory array
            {
                $project: {
                    _id: "$passengersubcategory._id", // Select the subcategory _id
                    name: "$passengersubcategory.name", // Select the subcategory name
                },
            },
        ]);
        const formattedpasstype = ticketPass.map((ticket) => ({
            id: ticket._id,
            passType: ticket.passType,
            transportType: ticket.transportType?.name || "N/A", // Handle undefined transportType
            transportSubType: ticket.transportSubType?.name || "N/A", // Handle undefined transportSubType
            noOfSeatTypes: Array.isArray(ticket.seatTypes)
                ? ticket.seatTypes.length
                : 0, // Ensure seatTypes is an array
            noOfPassengerTypes: Array.isArray(ticket.passengerSubTypes)
                ? ticket.passengerSubTypes.length
                : 0, // Ensure passengerSubTypes is an array
            gst: ticket.Gst,
            gstType: ticket.gstType?.name || "N/A",
            status: ticket.status,
        }));
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    formattedpasstype,
                    "passmasterlist",
                    "Pass master  fetch successfully"
                )
            );

        // res.status(200).json({
        //     success: true,
        //     data: formattedTicketPrices,
        // });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

export const updatePassMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const passMaster = await TMS_PassMaster.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).exec();

        if (!passMaster) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        null,
                        "Not Found",
                        "PassMaster not found"
                    )
                );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "PassMaster",
                    "PassMaster data updated successfully"
                )
            );
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Error", "Server Error"));
    }
});

export const deletePassMaster = asyncHandler(async (req, res) => {
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
        const passMaster = await TMS_PassMaster.findById(id);
        if (!passMaster) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        null,
                        "Not Found",
                        "PassMaster record not found"
                    )
                );
        }

        // Soft delete the record
        passMaster.isdeleted = 1;
        passMaster.deletedAt = new Date();
        await passMaster.save();

        // Return success response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Passmaster",
                    "PassMaster record marked as deleted successfully"
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
                    "Error marking PassMaster record as deleted"
                )
            );
    }
});
