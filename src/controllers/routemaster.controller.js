import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TMS_RouteMaster } from "../models/routemaster.model.js";
import mongoose from "mongoose";

export const createRouteMaster = asyncHandler(async (req, res, next) => {
    const { routeName, stations } = req.body;

    // Validate required fields
    if (
        !routeName ||
        !stations ||
        !Array.isArray(stations) ||
        stations.length === 0
    ) {
        return next(
            new ApiError(
                "Please provide a route name and at least one station ID",
                400
            )
        );
    }

    // Check if a route with the same routeName exists and is not deleted
    const existingRoute = await TMS_RouteMaster.findOne({
        routeName,
        isdeleted: { $ne: 1 }, // Exclude records where isdeleted is 1
    });

    if (existingRoute) {
        return res
            .status(409)
            .json(new ApiError(409, null, "Route Master Already Exists"));
    }

    try {
        // Create stations array with order
        const stationsWithOrder = stations.map((stationId, index) => ({
            station: stationId,
            order: index + 1,
        }));

        // Create a new route
        const newRoute = new TMS_RouteMaster({
            routeName,
            startPoint: stations[0], // Assuming the first station is the start point
            endPoint: stations[stations.length - 1], // Assuming the last station is the end point
            stations: stationsWithOrder,
            isdeleted: 0, // Set isdeleted to 0 for new routes
        });

        // Save the route to the database
        await newRoute.save();
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newRoute,
                    "RouteMaster",
                    "Route created successfully"
                )
            );
    } catch (error) {
        return next(
            new ApiError(
                500,
                null,
                "Something went wrong while creating Route Master"
            )
        );
    }
});

export const getRouteMasterDetails = asyncHandler(async (req, res, next) => {
    try {
        const routes = await TMS_RouteMaster.aggregate([
            {
                $match: { isdeleted: { $ne: "1" } },
            },
            {
                $lookup: {
                    from: "tms_stationmasters",
                    localField: "startPoint",
                    foreignField: "_id",
                    as: "startPoint",
                },
            },
            {
                $unwind: {
                    path: "$startPoint",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "tms_stationmasters",
                    localField: "endPoint",
                    foreignField: "_id",
                    as: "endPoint",
                },
            },
            {
                $unwind: {
                    path: "$endPoint",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "tms_stationmasters",
                    localField: "stations.station",
                    foreignField: "_id",
                    as: "stationsDetails",
                },
            },
            {
                $unwind: {
                    path: "$stationsDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },

            {
                $group: {
                    _id: "$_id",
                    routeName: { $first: "$routeName" },
                    startStationName: { $first: "$startPoint.name" },
                    stopStationName: { $first: "$endPoint.name" },
                    stationsDetails: {
                        $push: {
                            $cond: {
                                if: {
                                    $and: [
                                        {
                                            $ne: [
                                                "$stationsDetails.isdeleted",
                                                "1",
                                            ],
                                        },
                                        {
                                            $ne: [
                                                "$stationsDetails.status",
                                                "1",
                                            ],
                                        },
                                    ],
                                },
                                then: "$stationsDetails",
                                else: null,
                            },
                        },
                    },
                    //totalStations: { $sum: 1 }, // Count the number of stations
                    status: { $first: "$status" },
                    isdeleted: { $first: "$isdeleted" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                },
            },
            {
                $addFields: {
                    color: {
                        $cond: {
                            if: { $eq: ["$status", "0"] },
                            then: "#00944D", // Color for Active
                            else: "#FF0000", // Color for Deactive
                        },
                    },
                    Count: { $size: "$stationsDetails" },
                },
            },
            {
                $project: {
                    routeName: 1,
                    startStationName: 1,
                    stopStationName: 1,
                    totalStations: { $size: "$stationsDetails" },
                    status: 1,
                    color: 1,
                    // isdeleted: 1,
                    // createdAt: 1,
                    // updatedAt: 1,
                    // Count:1
                },
            },
        ]);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    routes,
                    "routeMaster",
                    "All Route fetched successfully"
                )
            );
        // res.status(200).json({ success: true, data: routes });
    } catch (error) {
        next(new ApiError("Error retrieving routes", 500));
    }
});

export const getRouteMasterDetailsById = asyncHandler(
    async (req, res, next) => {
        const routeId = new mongoose.Types.ObjectId(req.params.id); // Ensure correct ObjectId format
        try {
            // Check if the route exists
            const route = await TMS_RouteMaster.findById(req.params.id);
            if (!route) {
                return res
                    .status(404)
                    .json({ success: false, message: "Route not found" });
            }

            const result = await TMS_RouteMaster.aggregate([
                {
                    $match: { _id: routeId }, // Match the route by ID
                },
                {
                    $unwind: "$stations", // Unwind the stations array
                },
                {
                    $lookup: {
                        from: "tms_stationmasters", // Ensure this is the correct collection name
                        localField: "stations.station",
                        foreignField: "_id",
                        as: "stationDetails",
                    },
                },
                {
                    $unwind: "$stationDetails", // Flatten the station details array
                },
                {
                    $group: {
                        _id: "$_id",
                        routeName: { $first: "$routeName" },
                        stations: {
                            $push: {
                                _id: "$stationDetails._id",
                                stationName: "$stationDetails.name",
                                longitude: "$stationDetails.longitude",
                                latitude: "$stationDetails.latitude",
                                status: "$stationDetails.status",
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        color: {
                            $cond: {
                                if: { $eq: ["$status", "0"] },
                                then: "#00944D", // Color for Active
                                else: "#FF0000", // Color for Deactive
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0, // Exclude the route ID and other fields if not needed
                        routeName: 1,
                        stations: 1,
                    },
                },
                {
                    $sort: { "stations.order": 1 }, // Optional: Sort by order if needed
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "No stations found for the route",
                });
            }

            // Extract the station details array from the result
            const stations = result[0].stations;
            // console.log(stations);
            return res.status(200).json(
                new ApiResponse(
                    200,
                    result, //stations,
                    "routeStationMaster",
                    "All Route Station fetched successfully"
                )
            );
            // res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);
//old
export const updateRouteMaster1 = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    console.log(id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }

    const { routeName, status } = req.body;
    const route = await TMS_RouteMaster.findById(id);
    if (!route) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Station Not Found"));
    }

    const routemaster = await TMS_RouteMaster.findByIdAndUpdate(
        id,
        {
            $set: {
                routeName,
                status: status,
            },
        },
        { new: true }
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "routemaster",
                "Route Master Updated Successfully"
            )
        );
});
//code with update station without update first and laste station
export const updateRouteMaster2 = asyncHandler(async (req, res, next) => {
    const { routeName, status, stations, deactivateStationId } = req.body;
    const { id } = req.params;

    // Find the route by its ID
    const route = await TMS_RouteMaster.findById(id);

    if (!route) {
        return next(new ApiError("Route not found", 404));
    }

    // Update routeName if provided
    if (routeName) {
        route.routeName = routeName;
    }

    // Update status if provided
    if (status) {
        if (["0", "1"].includes(status)) {
            route.status = status;
        } else {
            return next(
                new ApiError(
                    'Status must be either "0" (Active) or "1" (Deactive)',
                    400
                )
            );
        }
    }
    if (deactivateStationId) {
        const station = route.stations.find(
            (s) => s.station.toString() === deactivateStationId
        );

        if (station) {
            station.status = "1"; // Deactivate the station
        } else {
            return next(new ApiError("Station not found in the route", 404));
        }
    }
    // Update stations if provided
    if (stations && Array.isArray(stations)) {
        const stationsWithOrder = stations.map((stationId, index) => ({
            station: stationId,
            order: index + 1,
        }));
        route.stations = stationsWithOrder;

        // Update startPoint and endPoint based on new stations
        if (stations.length > 0) {
            route.startPoint = stations[0];
            route.endPoint = stations[stations.length - 1];
        }
    }

    // Save the updated route to the database
    await route.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                route,
                "routeMaster",
                "Route updated successfully"
            )
        );
});
//in this code user cannot do deactive to active
export const updateRouteMaster3 = asyncHandler(async (req, res, next) => {
    const { routeName, status, stations, deactivateStationId } = req.body;
    const { id } = req.params;

    // Find the route by its ID
    const route = await TMS_RouteMaster.findById(id);

    if (!route) {
        return next(new ApiError("Route not found", 404));
    }

    // Update routeName if provided
    if (routeName) {
        route.routeName = routeName;
    }

    // Update route status if provided
    if (status) {
        if (["0", "1"].includes(status)) {
            route.status = status;
        } else {
            return next(
                new ApiError(
                    'Status must be either "0" (Active) or "1" (Deactive)',
                    400
                )
            );
        }
    }

    let updatedStartPoint = false;
    let updatedEndPoint = false;

    // Deactivate the status of a specific station if deactivateStationId is provided
    if (deactivateStationId) {
        const station = route.stations.find(
            (s) => s.station.toString() === deactivateStationId
        );

        if (station) {
            station.status = "1"; // Deactivate the station

            // If the deactivated station is the startPoint, update the startPoint
            if (route.startPoint.toString() === deactivateStationId) {
                // Find the next active station in the list
                const nextActiveStation = route.stations.find(
                    (s) => s.status === "0"
                );
                if (nextActiveStation) {
                    route.startPoint = nextActiveStation.station;
                    updatedStartPoint = true;
                } else {
                    return next(
                        new ApiError(
                            "No active stations available to set as startPoint",
                            400
                        )
                    );
                }
            }

            // If the deactivated station is the endPoint, update the endPoint
            if (route.endPoint.toString() === deactivateStationId) {
                // Find the previous active station in the list
                const prevActiveStation = [...route.stations]
                    .reverse()
                    .find((s) => s.status === "0");
                if (prevActiveStation) {
                    route.endPoint = prevActiveStation.station;
                    updatedEndPoint = true;
                } else {
                    return next(
                        new ApiError(
                            "No active stations available to set as endPoint",
                            400
                        )
                    );
                }
            }
        } else {
            return next(new ApiError("Station not found in the route", 404));
        }
    }

    // Update stations if provided
    if (stations && Array.isArray(stations)) {
        const stationsWithOrder = stations.map((stationId, index) => ({
            station: stationId,
            order: index + 1,
        }));
        route.stations = stationsWithOrder;

        // Update startPoint and endPoint based on new stations, if not already updated
        if (stations.length > 0 && !updatedStartPoint) {
            route.startPoint = stations[0];
        }
        if (stations.length > 0 && !updatedEndPoint) {
            route.endPoint = stations[stations.length - 1];
        }
    }

    // Save the updated route to the database
    await route.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                route,
                "routeMaster",
                "Route updated successfully"
            )
        );
});

export const updateRouteMaster = asyncHandler(async (req, res, next) => {
    const { routeName, status, stations, toggleStationId } = req.body;
    const { id } = req.params;

    // Find the route by its ID
    const route = await TMS_RouteMaster.findById(id);

    if (!route) {
        return next(new ApiError("Route not found", 404));
    }

    // Update routeName if provided
    if (routeName) {
        route.routeName = routeName;
    }

    // Update route status if provided
    if (status) {
        if (["0", "1"].includes(status)) {
            route.status = status;
        } else {
            return next(
                new ApiError(
                    'Status must be either "0" (Active) or "1" (Deactive)',
                    400
                )
            );
        }
    }

    let updatedStartPoint = false;
    let updatedEndPoint = false;

    // Toggle the status of a specific station if toggleStationId is provided
    if (toggleStationId) {
        const station = route.stations.find(
            (s) => s.station.toString() === toggleStationId
        );

        if (station) {
            // Toggle the station's status
            station.status = station.status === "0" ? "1" : "0";

            // Handle startPoint if the toggled station is the startPoint
            if (route.startPoint.toString() === toggleStationId) {
                if (station.status === "1") {
                    // Deactivated the startPoint, find the next active station
                    const nextActiveStation = route.stations.find(
                        (s) => s.status === "0"
                    );
                    if (nextActiveStation) {
                        route.startPoint = nextActiveStation.station;
                        updatedStartPoint = true;
                    } else {
                        return next(
                            new ApiError(
                                "No active stations available to set as startPoint",
                                400
                            )
                        );
                    }
                }
            }

            // Handle endPoint if the toggled station is the endPoint
            if (route.endPoint.toString() === toggleStationId) {
                if (station.status === "1") {
                    // Deactivated the endPoint, find the previous active station
                    const prevActiveStation = [...route.stations]
                        .reverse()
                        .find((s) => s.status === "0");
                    if (prevActiveStation) {
                        route.endPoint = prevActiveStation.station;
                        updatedEndPoint = true;
                    } else {
                        return next(
                            new ApiError(
                                "No active stations available to set as endPoint",
                                400
                            )
                        );
                    }
                }
            }

            // If the station is reactivated, check if it's necessary to update startPoint or endPoint
            if (station.status === "0") {
                // Reactivating first station updates the startPoint
                if (
                    station.station.toString() ===
                    route.stations[0].station.toString()
                ) {
                    route.startPoint = station.station;
                    updatedStartPoint = true;
                }

                if (!updatedEndPoint && !route.endPoint) {
                    route.endPoint = station.station;
                    updatedEndPoint = true;
                }
            }
        } else {
            return next(new ApiError("Station not found in the route", 404));
        }
    }

    // Update stations if provided
    if (stations && Array.isArray(stations)) {
        const stationsWithOrder = stations.map((stationId, index) => ({
            station: stationId,
            order: index + 1,
        }));
        route.stations = stationsWithOrder;

        // Update startPoint and endPoint based on new stations, if not already updated
        if (stations.length > 0 && !updatedStartPoint) {
            route.startPoint = stations[0];
        }
        if (stations.length > 0 && !updatedEndPoint) {
            route.endPoint = stations[stations.length - 1];
        }
    }

    // Save the updated route to the database
    await route.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                route,
                "routeMaster",
                "Route updated successfully"
            )
        );
});

export const deleteRouteMaster = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }

    const route = await TMS_RouteMaster.findById(id);
    if (!route) {
        return res.status(404).json(new ApiError(404, null, "Route Not Found"));
    }
    route.isdeleted = 1;
    route.deletedAt = new Date();
    await route.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "RouteMaster",
                "RouteMaster Deleted Successfully"
            )
        );
});
