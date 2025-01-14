import { TMS_TicketPriceMaster } from "../models/ticketpricemaster.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { TMS_TransportMaster } from "../models/transportmastr.model.js";
import { TMS_TransportSubCategory } from "../models/transportsubcategory.model.js";
import { TMS_SeatMaster } from "../models/seatmaster.model.js";
import { TMS_RouteMaster } from "../models/routemaster.model.js";
import { TMS_PassengerMaster } from "../models/passengermaster.model.js";

import { TMS_TaxMaster } from "../models/taxmaster.model.js";
import mongoose from "mongoose";

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
    const passengerSubcategories = await TMS_PassengerMaster.aggregate([
        { $unwind: "$passengersubcategory" }, // Unwind the passengersubcategory array
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
        route: routeMaster,
        passenger: passengerSubcategories,
        gst: taxMaster,
        // routes: routeData,
        // Add more as needed...
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

export const definePrice = asyncHandler(async (req, res) => {
    const {
        fareType,
        transporttypeId,
        transportsubTypeId,
        seattypeId,
        routeId,
        passengersubTypeid,
        Gst,
        gstTypeId, // Optional if Gst is Exclude
    } = req.body;

    try {
        // Fetch related data based on IDs
        const transportType = await TMS_TransportMaster.findById(
            transporttypeId
        )
            .select("_id name")
            .exec();
        const transportSubType = await TMS_TransportSubCategory.findById(
            transportsubTypeId
        )
            .select("_id name")
            .exec();
        const seatTypes = await TMS_SeatMaster.find({
            _id: { $in: seattypeId },
        })
            .select("_id name")
            .exec();
        const route = await TMS_RouteMaster.findById(routeId)
            .populate({
                path: "stations.station",
                select: "name",
                model: "TMS_StationMaster",
            })
            .exec();
        const passengerSubTypes = await TMS_PassengerMaster.aggregate([
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

        let gstType = null;
        if (Gst === "Include") {
            gstType = await TMS_TaxMaster.findById(gstTypeId)
                .select("_id name taxPercentage")
                .exec();
        }

        // Prepare response data based on fareType
        let responseData;

        if (fareType === "Station_Based") {
            const stations = route.stations
                ? route.stations
                    .map((station) => station.station) // Get station objects
                    .filter(station => station) // Filter out any null or undefined
                : [];
        
            const stationNames = stations.map((station) => station.name || "Unknown"); // Provide a default name
            const stationPairs = [];
        
            for (let i = 0; i < stationNames.length; i++) {
                for (let j = i + 1; j < stationNames.length; j++) {
                    stationPairs.push({
                        from: stationNames[i],
                        upto: stationNames[j],
                    });
                }
            }
        
            responseData = {
                fareType,
                transportType: {
                    id: transportType._id,
                    name: transportType.name,
                },
                transportSubType: {
                    id: transportSubType._id,
                    name: transportSubType.name,
                },
                seatTypes: seatTypes.map((seat) => ({
                    id: seat._id,
                    name: seat.name,
                })),
                passengerSubTypes: passengerSubTypes.map((passenger) => ({
                    id: passenger._id,
                    name: passenger.name,
                })),
                Gst,
                gstType: gstType
                    ? {
                          id: gstType._id,
                          name: gstType.name,
                          value: gstType.taxPercentage,
                      }
                    : null,
                prices: stationPairs.flatMap((pair) =>
                    seatTypes.map((seat) => ({
                        from: pair.from,
                        upto: pair.upto,
                        seatType: { id: seat._id, name: seat.name },
                        passengerSubTypes: passengerSubTypes.map((passenger) => ({
                            passengerType: {
                                id: passenger._id,
                                name: passenger.name,
                            },
                            fare: 1, // Replace with real fare logic
                            gst: Gst === "Include"
                                ? parseFloat(((1 * gstType.taxPercentage) / 100).toFixed(2))
                                : 0,
                            totalprice: Gst === "Include"
                                ? 1 + parseFloat(((1 * gstType.taxPercentage) / 100).toFixed(2))
                                : 1,
                        })),
                    }))
                ),
            };
        }else if (fareType === "KM_Based") {
            responseData = {
                fareType,
                transportType: {
                    id: transportType._id,
                    name: transportType.name,
                },
                transportSubType: {
                    id: transportSubType._id,
                    name: transportSubType.name,
                },
                seatTypes: seatTypes.map((seat) => ({
                    id: seat._id,
                    name: seat.name,
                })),
                passengerSubTypes: passengerSubTypes.map((passenger) => ({
                    id: passenger._id,
                    name: passenger.name,
                })),
                Gst,
                gstType: gstType
                    ? {
                          id: gstType._id,
                          name: gstType.name,
                          value: gstType.taxPercentage,
                      }
                    : null,
                prices: seatTypes.map((seat) => ({
                    seatType: { id: seat._id, name: seat.name },
                    from: null,
                    upto: null,
                    passengerSubTypes: passengerSubTypes.map((passenger) => ({
                        passengerType: {
                            id: passenger._id,
                            name: passenger.name,
                        },
                        fare: 1, // Replace with real fare logic
                        gst:
                            Gst === "Include"
                                ? parseFloat(
                                      (
                                          (1 * gstType.taxPercentage) /
                                          100
                                      ).toFixed(2)
                                  )
                                : 0,
                        totalprice:
                            Gst === "Include"
                                ? 1 +
                                  parseFloat(
                                      (
                                          (1 * gstType.taxPercentage) /
                                          100
                                      ).toFixed(2)
                                  )
                                : 1, // Replace with real total price calculation
                    })),
                })),
            };
        } else {
            return res
                .status(400)
                .json(new ApiResponse(400, null, "Error", "Invalid fare type"));
        }

        // Return the constructed response with both ID and name
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    responseData,
                    "priceData",
                    "Price data with respective names and IDs"
                )
            );
    } catch (error) {
        console.error("Error defining price:", error);
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Error", "Error defining price"));
    }
});

export const createTicketPrice = asyncHandler(async (req, res) => {
    const {
        fareType,
        transportType,
        transportSubType,
        seatTypes,
        route,
        passengerSubTypes,
        Gst,
        gstType,
        prices,
    } = req.body;

    const ticketPriceDefinition = new TMS_TicketPriceMaster({
        fareType,
        transportType,
        transportSubType,
        seatTypes,
        route,
        passengerSubTypes,
        Gst,
        gstType,
        prices,
    });

    // Save to database

    const createdTicketPrice = await ticketPriceDefinition.save();

    // Return the created ticket price definition
    res.status(201).json({
        success: true,
        data: createdTicketPrice,
    });
});

export const priceMasterList = asyncHandler(async (req, res) => {
    try {
        const ticketPrices = await TMS_TicketPriceMaster.find({})
            .populate("transportType", "name") // Assuming transportType has a 'name' field
            .populate("transportSubType", "name") // Assuming transportSubType has a 'name' field
            .populate("seatTypes", "seatType") // Assuming seatTypes has a 'seatType' field
            .populate("route", "routeName") // Assuming route has a 'routeName' field
            .populate("passengerSubTypes", "name") // Assuming passengerSubTypes has a 'passengerType' field
            .populate("gstType", "name") // Assuming gstType has a 'taxName' field
            .select(
                "fareType transportType transportSubType seatTypes passengerSubTypes route Gst name status"
            );
        // .lean();
        // console.log(ticketPrices[0].route.routeName);

        const formattedTicketPrices = ticketPrices.map((ticket) => ({
            id: ticket._id,
            fareType: ticket.fareType,
            transportType: ticket.transportType?.name || "N/A", // Handle undefined transportType
            transportSubType: ticket.transportSubType?.name || "N/A", // Handle undefined transportSubType
            noOfSeatTypes: Array.isArray(ticket.seatTypes)
                ? ticket.seatTypes.length
                : 0, // Ensure seatTypes is an array
            noOfPassengerTypes: Array.isArray(ticket.passengerSubTypes)
                ? ticket.passengerSubTypes.length
                : 0, // Ensure passengerSubTypes is an array
            routeName: ticket.route?.routeName || "N/A", // Handle undefined route or routeName
            gst: ticket.Gst,
            gstType: ticket.gstType?.name || "N/A",
            status: ticket.status,
        }));
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    formattedTicketPrices,
                    "ticketpricelist",
                    "Ticket price  fetch successfully"
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

// export const getTicketPriceMasterById = asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     try {
//         // Fetch the ticket price master document with populated fields
//         const priceMaster = await TMS_TicketPriceMaster.findById(id)
//             .populate({
//                 path: "gstType",
//                 select: "_id name color",
//             })
//             .populate({
//                 path: "seatTypes",
//                 select: "_id name color",
//             })
//             .populate({
//                 path: "transportSubType",
//                 select: "_id name color",
//             })
//             .populate({
//                 path: "transportType",
//                 select: "_id name",
//             })
            
//             .exec();

//         if (!priceMaster) {
//             return res.status(404).json({
//                 status: false,
//                 statusCode: 404,
//                 message: "PriceMaster not found",
//                 priceMasterData: null,
//             });
//         }

//         // Manually populate nested fields in `prices` array
//         const populatedPrices = await Promise.all(
//             priceMaster.prices.map(async (price) => {
//                 const seatType = await TMS_SeatMaster.findById(price.seatType);
//                 const passengerSubTypes = await Promise.all(
//                     price.passengerSubTypes.map(async (subType) => {
//                         // Find the PassengerMaster that contains the passengersubcategory with the matching _id
//                         const passengerMaster = await TMS_PassengerMaster.findOne(
//                             { "passengersubcategory._id": subType.passengerType },
//                             { "passengersubcategory.$": 1 } // Limit the result to the matching subcategory
//                         );
                
//                         // If the matching passenger subcategory is found, extract the name and _id
//                         const passengerSubCategory = passengerMaster?.passengersubcategory[0];
                
//                         return {
//                             ...subType.toObject(),
//                             passengerType: passengerSubCategory
//                                 ? {
//                                       _id: passengerSubCategory._id,
//                                       name: passengerSubCategory.name,
//                                   }
//                                 : null,
//                         };
//                     })
//                     // price.passengerSubTypes.map(async (subType) => {
//                     //     const passengerType =
//                     //         await TMS_PassengerMaster.findById(
//                     //             subType.passengerType
//                     //         );
//                     //     return {
//                     //         ...subType.toObject(),
//                     //         passengerType: passengerType
//                     //             ? {
//                     //                   _id: passengerType._id,
//                     //                   name: passengerType.name,
//                     //               }
//                     //             : null,
//                     //     };
//                     // })
//                 );
               
//                 return {
//                     ...price.toObject(),
//                     seatType: seatType
//                         ? {
//                               _id: seatType._id,
//                               name: seatType.name,
//                               color: seatType.color,
//                           }
//                         : null,
//                     passengerSubTypes,
//                 };
//             })
//         );
//         console.log("value", populatedPrices);
//         // Format the response
//         const formattedResponse = {
//             status: true,
//             statusCode: 200,
//             message: "PriceMaster data fetched successfully",
//             priceMasterData: {
//                 _id: priceMaster._id,
//                 fareType: priceMaster.fareType,
//                 status: priceMaster.status,
//                 isdeleted: priceMaster.isdeleted,
//                 createdAt: priceMaster.createdAt,
//                 Gst: priceMaster.Gst,
//                 gstType: priceMaster.gstType
//                     ? {
//                           _id: priceMaster.gstType._id,
//                           name: priceMaster.gstType.name,
//                           color: priceMaster.gstType.color,
//                       }
//                     : null,
//                 seatTypes: priceMaster.seatTypes.map((seat) => ({
//                     _id: seat._id,
//                     name: seat.name,
//                     color: seat.color,
//                 })),
               
//                 transportSubType: priceMaster.transportSubType
//                     ? {
//                           _id: priceMaster.transportSubType._id,
//                           name: priceMaster.transportSubType.name,
//                           color: priceMaster.transportSubType.color,
//                       }
//                     : null,
//                 transportType: priceMaster.transportType
//                     ? {
//                           _id: priceMaster.transportType._id,
//                           name: priceMaster.transportType.name,
//                       }
//                     : null,
//                 prices: populatedPrices,
//             },
//         };

//         return res.status(200).json(formattedResponse);
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             status: false,
//             statusCode: 500,
//             message: "Server Error",
//             priceMasterData: null,
//         });
//     }
// });

export const getTicketPriceMasterById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the ticket price master document with populated fields
        const priceMaster = await TMS_TicketPriceMaster.findById(id)
            .populate({
                path: "gstType",
                select: "_id name color",
            })
            .populate({
                path: "seatTypes",
                select: "_id name color",
            })
            .populate({
                path: "transportSubType",
                select: "_id name color",
            })
            .populate({
                path: "transportType",
                select: "_id name",
            })
            .populate({
                path: "route",
                select: "_id routeName", // Fetching both ID and name
            })
            .exec();

        if (!priceMaster) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "PriceMaster not found",
                priceMasterData: null,
            });
        }

        // Manually populate nested fields in `prices` array
        const populatedPrices = await Promise.all(
            priceMaster.prices.map(async (price) => {
                const seatType = await TMS_SeatMaster.findById(price.seatType);
                const passengerSubTypes = await Promise.all(
                    price.passengerSubTypes.map(async (subType) => {
                        const passengerMaster = await TMS_PassengerMaster.findOne(
                            { "passengersubcategory._id": subType.passengerType },
                            { "passengersubcategory.$": 1 }
                        );
                
                        const passengerSubCategory = passengerMaster?.passengersubcategory[0];
                
                        return {
                            ...subType.toObject(),
                            passengerType: passengerSubCategory
                                ? {
                                      _id: passengerSubCategory._id,
                                      name: passengerSubCategory.name,
                                  }
                                : null,
                        };
                    })
                );
               
                return {
                    ...price.toObject(),
                    seatType: seatType
                        ? {
                              _id: seatType._id,
                              name: seatType.name,
                              color: seatType.color,
                          }
                        : null,
                    passengerSubTypes,
                };
            })
        );

        // Format the response
        const formattedResponse = {
            status: true,
            statusCode: 200,
            message: "PriceMaster data fetched successfully",
            priceMasterData: {
                _id: priceMaster._id,
                fareType: priceMaster.fareType,
                status: priceMaster.status,
                isdeleted: priceMaster.isdeleted,
                createdAt: priceMaster.createdAt,
                Gst: priceMaster.Gst,
                gstType: priceMaster.gstType
                    ? {
                          _id: priceMaster.gstType._id,
                          name: priceMaster.gstType.name,
                          color: priceMaster.gstType.color,
                      }
                    : null,
                seatTypes: priceMaster.seatTypes.map((seat) => ({
                    _id: seat._id,
                    name: seat.name,
                    color: seat.color,
                })),
                transportSubType: priceMaster.transportSubType
                    ? {
                          _id: priceMaster.transportSubType._id,
                          name: priceMaster.transportSubType.name,
                          color: priceMaster.transportSubType.color,
                      }
                    : null,
                transportType: priceMaster.transportType
                    ? {
                          _id: priceMaster.transportType._id,
                          name: priceMaster.transportType.name,
                      }
                    : null,
                route: priceMaster.route
                    ? {
                          _id: priceMaster.route._id, // Include route ID
                          name: priceMaster.route.routeName, // Include route name
                      }
                    : null,
                prices: populatedPrices,
            },
        };

        return res.status(200).json(formattedResponse);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            statusCode: 500,
            message: "Server Error",
            priceMasterData: null,
        });
    }
});



// export const getTicketPriceMasterById = asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     try {
//         // Fetch the ticket price master document with populated fields
//         const priceMaster = await TMS_TicketPriceMaster.findById(id)
//             .populate({
//                 path: "gstType",
//                 select: "_id name color",
//             })
//             .populate({
//                 path: "seatTypes",
//                 select: "_id name color",
//             })
//             .populate({
//                 path: "transportSubType",
//                 select: "_id name color",
//             })
//             .populate({
//                 path: "transportType",
//                 select: "_id name",
//             })
//             .populate({
//                 path: "prices.passengerSubTypes.passengerType",
//                 select: "_id name",
//             })
//             .exec();

//         if (!priceMaster) {
//             return res.status(404).json({
//                 status: false,
//                 statusCode: 404,
//                 message: "PriceMaster not found",
//                 priceMasterData: null,
//             });
//         }

//         // Manually populate nested fields in `prices` array
//         const populatedPrices = await Promise.all(
//             priceMaster.prices.map(async (price) => {
//                 const seatType = await TMS_SeatMaster.findById(price.seatType);
//                 const passengerType = await TMS_PassengerMaster.findById(price.passengerType);
//                 // const passengerSubTypes = await Promise.all(
//                 //     price.passengerSubTypes.map(async (subType) => {
//                 //         const passengerType =
//                 //             await TMS_PassengerMaster.findById(
//                 //                 subType.passengerType
//                 //             );
//                 //         return {
//                 //             ...subType.toObject(),
//                 //             passengerType: passengerType
//                 //                 ? {
//                 //                       _id: passengerType._id,
//                 //                       name: passengerType.name,
//                 //                   }
//                 //                 : null,
//                 //         };
//                 //     })
//                 // );
               
//                 return {
//                     ...price.toObject(),
//                     seatType: seatType
//                         ? {
//                               _id: seatType._id,
//                               name: seatType.name,
//                               color: seatType.color,
//                           }
//                         : null,
//                         passengerType,
//                 };
//             })
//         );
//         console.log("value", populatedPrices);
//         // Format the response
//         const formattedResponse = {
//             status: true,
//             statusCode: 200,
//             message: "PriceMaster data fetched successfully",
//             priceMasterData: {
//                 _id: priceMaster._id,
//                 fareType: priceMaster.fareType,
//                 status: priceMaster.status,
//                 isdeleted: priceMaster.isdeleted,
//                 createdAt: priceMaster.createdAt,
//                 Gst: priceMaster.Gst,
//                 gstType: priceMaster.gstType
//                     ? {
//                           _id: priceMaster.gstType._id,
//                           name: priceMaster.gstType.name,
//                           color: priceMaster.gstType.color,
//                       }
//                     : null,
//                 seatTypes: priceMaster.seatTypes.map((seat) => ({
//                     _id: seat._id,
//                     name: seat.name,
//                     color: seat.color,
//                 })),
//                 // passengerSubTypes: priceMaster.passengerSubTypes.map(
//                 //     (passenger) => ({
//                 //         _id: passenger._id,
//                 //         name: passenger.name,
//                 //         color: passenger.color,
//                 //     })
//                 // ),
//                 transportSubType: priceMaster.transportSubType
//                     ? {
//                           _id: priceMaster.transportSubType._id,
//                           name: priceMaster.transportSubType.name,
//                           color: priceMaster.transportSubType.color,
//                       }
//                     : null,
//                 transportType: priceMaster.transportType
//                     ? {
//                           _id: priceMaster.transportType._id,
//                           name: priceMaster.transportType.name,
//                       }
//                     : null,
//                 prices: populatedPrices,
//             },
//         };

//         return res.status(200).json(formattedResponse);
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             status: false,
//             statusCode: 500,
//             message: "Server Error",
//             priceMasterData: null,
//         });
//     }
// });

export const priceMasterList1 = asyncHandler(async (req, res) => {
    try {
        const ticketPrices = await TMS_TicketPriceMaster.find({})
            .populate("transportType", "name") // Assuming transportType has a 'name' field
            .populate("transportSubType", "name") // Assuming transportSubType has a 'name' field
            .populate("seatTypes", "seatType") // Assuming seatTypes has a 'seatType' field
            .populate("route", "routeName") // Assuming route has a 'routeName' field
            .populate("passengerSubTypes", "name") // Assuming passengerSubTypes has a 'passengerType' field
            .populate("gstType", "name") // Assuming gstType has a 'taxName' field
            .select(
                "fareType transportType transportSubType seatTypes passengerSubTypes route Gst name status"
            );
        // .lean();
        // console.log(ticketPrices[0].route.routeName);

        const formattedTicketPrices = ticketPrices.map((ticket) => ({
            fareType: ticket.fareType,
            transportType: ticket.transportType?.name || "N/A", // Handle undefined transportType
            transportSubType: ticket.transportSubType?.name || "N/A", // Handle undefined transportSubType
            noOfSeatTypes: Array.isArray(ticket.seatTypes)
                ? ticket.seatTypes.length
                : 0, // Ensure seatTypes is an array
            noOfPassengerTypes: Array.isArray(ticket.passengerSubTypes)
                ? ticket.passengerSubTypes.length
                : 0, // Ensure passengerSubTypes is an array
            routeName: ticket.route?.routeName || "N/A", // Handle undefined route or routeName
            gst: ticket.Gst,
            gstType: ticket.gstType?.name || "N/A",
            status: ticket.status,
        }));
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    formattedTicketPrices,
                    "ticketpricelist",
                    "Ticket price  fetch successfully"
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

//Not use

export const createTicketPriceMaster = asyncHandler(async (req, res, next) => {
    const {
        fareType,
        transportMasterID,
        subtransportMasterID,
        seatMasterID,
        routeMasterID,
        passengerMasterID,
        gst,
        gstMasterID,
        // pricingRules
    } = req.body;

    // Validate required fields
    if (!fareType || !gst) {
        return next(
            new ApiError(
                "Fare type, GST status, and pricing rules are required",
                400
            )
        );
    }

    // Check if fareType is valid
    if (!["KM_Based", "Station_Based"].includes(fareType)) {
        return next(new ApiError("Invalid fare type", 400));
    }

    // Create the ticket pricing master document
    const ticketPriceMaster = new TMS_TicketPriceMaster({
        fareType,
        transportMasterID,
        subtransportMasterID,
        seatMasterID,
        routeMasterID,
        passengerMasterID,
        gst,
        gstMasterID,
        // pricingRules
    });

    const priceData = await TMS_TicketPriceMaster.aggregate([
        {
            $lookup: {
                from: "tms_transportmasters",
                localField: "transportMasterID",
                foreignField: "_id",
                as: "transportName",
            },
        },
        { $unwind: "$transportName" },
        {
            $lookup: {
                from: "tms_transportsubcategories",
                localField: "subtransportMasterID",
                foreignField: "_id",
                as: "SubTransport",
            },
        },
        { $unwind: "$SubTransport" },
        {
            $lookup: {
                from: "tms_seatmasters",
                localField: "seatMasterID",
                foreignField: "_id",
                as: "SeatMasterType",
            },
        },
        { $unwind: "$SeatMasterType" },
        {
            $lookup: {
                from: "tms_routemasters",
                localField: "routeMasterID",
                foreignField: "_id",
                as: "RouteMaster",
            },
        },
        { $unwind: "$RouteMaster" },
        {
            $lookup: {
                from: "tms_passengermasters",
                localField: "passengerMasterID",
                foreignField: "passengersubcategory._id",
                as: "PassengerMaster",
            },
        },
        { $unwind: "$PassengerMaster" },
        {
            $lookup: {
                from: "tms_taxmasters",
                localField: "gstMasterID",
                foreignField: "_id",
                as: "gstType",
            },
        },
        { $unwind: "$gstType" },
        {
            $group: {
                _id: "$_id",
                fareType: { $first: "$fareType" },
                TransportTypeId: { $first: "$transportName._id" },
                TransportTypename: { $first: "$transportName.name" },
                SubTransportId: { $first: "$SubTransport._id" },
                SubTransportName: { $first: "$SubTransport.name" },
                gst: { $first: "$gst" },
                SeatTypes: {
                    $push: {
                        SeatTypeId: "$SeatMasterType._id",
                        SeatTypeName: "$SeatMasterType.name",
                    },
                },
                RouteId: { $first: "$RouteMaster._id" },
                RouteName: { $first: "$RouteMaster.routeName" },
                Passenger: {
                    $push: {
                        SeatId: "$PassengerMaster._id",
                        SeatName: "$PassengerMaster.name",
                    },
                },
                gstTypeId: { $first: "$gstType._id" },
                gstTypeName: { $first: "$gstType.name" },
            },
        },
        {
            $project: {
                _id: 1,
                fareType: 1,
                gst: 1,
                TransportDetails: {
                    id: "$TransportTypeId",
                    name: "$TransportTypename",
                },
                SubTransportDetails: {
                    id: "$SubTransportId",
                    name: "$SubTransportName",
                },
                Seats: {
                    $map: {
                        input: "$SeatTypes",
                        as: "seat",
                        in: {
                            id: "$$seat.SeatTypeId",
                            name: "$$seat.SeatTypeName",
                        },
                    },
                },
                RouteDetails: {
                    id: "$RouteId",
                    name: "$RouteName",
                },
                Passenger: {
                    $map: {
                        input: "$Passenger",
                        as: "passenger",
                        in: {
                            id: "$$passenger.SeatId",
                            name: "$$passenger.SeatName",
                        },
                    },
                },
                gstType: {
                    id: "$gstTypeId",
                    name: "$gstTypeName",
                },
            },
        },
    ]);

    // Format the response
    const formattedResponse = {
        status: true,
        statusCode: 200,
        message: "Ticket Master Price update",
        fareType: {
            id: priceData[0]._id,
            name: priceData[0].fareType,
        },
        transportType: {
            id: priceData[0].TransportDetails.id,
            name: priceData[0].TransportDetails.name,
        },
        transportSubType: {
            id: priceData[0].SubTransportDetails.id,
            name: priceData[0].SubTransportDetails.name,
        },
        seatType: priceData[0].Seats.map((seat) => ({
            id: seat.id,
            name: seat.name,
        })),
        passengerType: priceData[0].Passenger.map((passenger) => ({
            id: passenger.id,
            name: passenger.name,
        })),
        root: {
            id: priceData[0].RouteDetails.id,
            name: priceData[0].RouteDetails.name,
        },
        gst: {
            id: priceData[0].gstType.id,
            name: "Included",
        },
        gstType: {
            id: priceData[0].gstType.id,
            name: priceData[0].gstType.name,
        },
        PricingInfo: priceData.map((data) => ({
            id: data._id,
            name: data.Seats[0].name, // Adjust as per your pricingRules structure
            citizenType: data.Passenger.map((passenger) => ({
                id: passenger.id,
                name: passenger.name,
                passengerCategory: data.Passenger.map((passenger) => ({
                    id: passenger.id, // Adjust as per your pricingRules structure
                    name: passenger.name, // Adjust as per your pricingRules structure
                    gst: data.gstType.name, // Adjust as per your pricingRules structure
                })),
            })),
        })),
    };

    return res.status(200).json(formattedResponse);
});

export const updateTicketPrice = asyncHandler(async (req, res) => {
    const { id } = req.params; // Assuming ID is passed in the URL params
    const {
        transportType,
        transportSubType,
        seatTypes,
        route,
        passengerSubTypes,
        Gst,
        gstType,
        prices,
    } = req.body;

    try {
        const existingTicketPrice = await TMS_TicketPriceMaster.findById(id);
        if (!existingTicketPrice) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        null,
                        "Error",
                        "Ticket price  not found"
                    )
                );
        }

        // Update the ticket price definition with the new data

        existingTicketPrice.transportType = transportType;
        existingTicketPrice.transportSubType = transportSubType;
        existingTicketPrice.seatTypes = seatTypes;
        existingTicketPrice.route = route;
        existingTicketPrice.passengerSubTypes = passengerSubTypes;
        existingTicketPrice.Gst = Gst;
        existingTicketPrice.gstType = gstType;
        existingTicketPrice.prices = prices;

        // Save the updated ticket price definition to the database
        const updatedTicketPrice = await existingTicketPrice.save();

        // Return the updated ticket price definition
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedTicketPrice,
                    "pricemaster",
                    "Ticket price  updated successfully"
                )
            );
    } catch (error) {
        console.error("Error updating ticket price:", error);
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    null,
                    "Error",
                    "Error updating ticket price"
                )
            );
    }
});
export const deleteTicketPriceMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate the ID
    if (!id) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Error", "ID is required"));
    }

    try {
        const result = await TMS_TicketPriceMaster.findByIdAndUpdate(
            id,
            { isdeleted: 1 }, // Set isDeleted flag to 1
            { new: true, runValidators: true }
        ).exec();

        if (!result) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        null,
                        "Error",
                        "Ticket Price Master not found"
                    )
                );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "pricemaster",
                    "Ticket Price Master deleted successfully"
                )
            );
    } catch (error) {
        console.error("Error deleting ticket price master:", error);
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    null,
                    "Error",
                    "Error deleting ticket price master"
                )
            );
    }
});
