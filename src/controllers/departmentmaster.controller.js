import { TMS_DepartmentMaster } from "../models/departmentmaster.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
    isValidString,
    areValidStrings,
    ValidString,
    isValidEmployeeCode,
} from "../utils/stringValidation.js";

export const createdepartmentMaster = asyncHandler(async (req, res) => {
    const {
        employeecode,
        name,
        role,
        email,
        phoneNumber,
        counter,
        username,
        password,
    } = req.body;
    if (
        !employeecode ||
        !name ||
        !role ||
        !email ||
        !phoneNumber ||
        !username ||
        !password
    ) {
        return res
            .status(400)
            .json(new ApiError(400, null, "All fields are required"));
    }
    if (!areValidStrings(name, role)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Invalid  name, or role"));
    }
    if (!isValidEmployeeCode(employeecode)) {
        return res
            .status(400)
            .json(
                new ApiError(
                    400,
                    null,
                    "Employeecode must be a non-empty string without spaces or special characters"
                )
            );
    }
    const existingByEmailOrUsername = await TMS_DepartmentMaster.findOne({
        $or: [{ email: email }, { username: username }],
        isdeleted: { $ne: "1" },
    });

    if (existingByEmailOrUsername) {
        return res
            .status(409)
            .json(new ApiError(409, null, "Email or Username already exists"));
    }

    const existingDepartment = await TMS_DepartmentMaster.findOne({
        employeecode: employeecode,
        email: email,
        phoneNumber: phoneNumber,
        username: username,
        isdeleted: { $ne: "1" },
    });

    if (existingDepartment) {
        return res
            .status(409)
            .json(new ApiError(409, null, "Department Master Already Exists"));
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const updateData = {
            name,
            role,
            counter,
            isdeleted: "0",
            password: password,
            hashpassword: hashedPassword,
        };

        let newDepartmentMaster = await TMS_DepartmentMaster.findOneAndUpdate(
            { employeecode, email, phoneNumber, username, isdeleted: "1" },
            { $set: updateData },
            { new: true, upsert: true }
        );

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    newDepartmentMaster,
                    "DepartmentMaster",
                    "Department Master Created Successfully"
                )
            );
    } catch (error) {
        console.error(error); // Log detailed error
        if (error.code === 11000) {
            return res
                .status(409)
                .json(
                    new ApiError(409, null, "Department Master Already Exists")
                );
        }
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while creating Department Master"
                )
            );
    }
});

export const getDepartmentMasterById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Invalid Department ID"));
    }

    const department = await TMS_DepartmentMaster.findOne({
        _id: id,
        isdeleted: { $ne: "1" },
    }).select(" -__v -createdAt -updatedAt");

    if (!department) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Department Master Not Found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                department,
                "Department Master Fetched Successfully"
            )
        );
});

export const getDepartmentMasterList = asyncHandler(async (req, res) => {
    try {
        const departmentMasters = await TMS_DepartmentMaster.find({
            isdeleted: { $ne: 1 },
        })
            .select("-__v -createdAt -hashpassword -updatedAt -isdeleted")
            .populate({
                path: "counter",
                select: "name",
            });

        const modifiedDepartmentMasters = departmentMasters.map(
            (department) => {
                return {
                    ...department.toObject(),
                    counterName: department.counter
                        ? department.counter.name
                        : null,
                    counter: undefined,
                };
            }
        );

        if (!modifiedDepartmentMasters.length) {
            return res
                .status(404)
                .json(new ApiError(404, null, "No Department Masters found"));
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    modifiedDepartmentMasters,
                    "DepartmentMaster",
                    "Department Masters fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    null,
                    "Something went wrong while fetching Department Masters"
                )
            );
    }
});

export const updateDepartmentMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }
    const {
        employeecode,
        name,
        role,
        email,
        phoneNumber,
        counter,
        username,
        password,
    } = req.body;
    const departmentmaster = await TMS_DepartmentMaster.findOne({
        _id: id,
        isdeleted: { $ne: 1 },
    });

    if (!departmentmaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Department Master Not Found"));
    }
    try {
        const updatedDepartmentMaster =
            await TMS_DepartmentMaster.findByIdAndUpdate(
                id,
                {
                    employeecode,
                    name,
                    role,
                    email,
                    phoneNumber,
                    counter,
                    username,
                    password,
                },
                { new: true }
            );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "DeprtmentMaster",
                    "Department Master updated successfully"
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

export const deleteDepartmentMaster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiError(400, null, "ID is invalid"));
    }
    const departmentmaster = await TMS_DepartmentMaster.findById(id);
    if (!departmentmaster) {
        return res
            .status(404)
            .json(new ApiError(404, null, "Department Master Not Found"));
    }
    departmentmaster.isdeleted = 1;
    departmentmaster.deletedAt = new Date();
    await departmentmaster.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "departmentmaster",
                "department Master Deleted Successfully"
            )
        );
});
