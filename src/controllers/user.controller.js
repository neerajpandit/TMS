import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import path from "path";
import { compressAndSaveImage } from "../utils/imgCompress.js";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating referesh and access token"
        );
    }
};

//user Registeration
const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, email, phoneNo, role, password } = req.body;
    //console.log("email: ", email);

    if (
        [username, fullName, email, phoneNo, role, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "Username with email or phoneNo already exists"
        );
    }

    let imgUrl;
    // Check file type and process accordingly
    if (req.file.mimetype.startsWith("image/")) {
        // Compress and save the image
        const imagePath = await compressAndSaveImage(
            req.file.buffer,
            req.file.originalname
        );
        imgUrl = `${path.basename(imagePath)}`;
    } else if (req.file.mimetype === "application/pdf") {
        // Directly save the PDF
        const pdfPath = await savePdf(req.file.buffer, req.file.originalname);
        imgUrl = `${path.basename(pdfPath)}`;
    } else {
        return res.status(400).send("Unsupported file type.");
    }

    const user = await User.create({
        username,
        fullName,
        email,
        phoneNo,
        password,
        profileUrl: imgUrl,
        role: role || "0",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        );
});
//user Login
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    // console.log(email);

    if (!password && !username) {
        return res
            .status(400)
            .json(new ApiError(400, null, "password or username is required"));
    }

    const user = await User.findOne({
        $or: [{ username }],
    });
    if (!user) {
        return res
            .status(404)
            .json(new ApiError(404, null, "User does not exist"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return res
            .status(401)
            .json(new ApiError(401, null, "Invalid user credentials"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password  -profileUrl -username  -refreshToken -createdAt -updatedAt -__v"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                loggedInUser,
                "userInfo",
                "User logged In Successfully",
                accessToken,
                refreshToken
            )
        );
});

//logout User
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, // this removes the field from document
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, {}, "User logged Out"));
});

//deleteuser Account
const deleteAccount = asyncHandler(async (req, res) => {
    const { phoneNo } = req.body;

    if (!phoneNo) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Phone number not found in session"));
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNo });

    if (!user) {
        return res
            .status(404)
            .json(
                new ApiError(404, null, "User not found Enter Correct PhoneNo")
            );
    }

    // Ensure that the current user matches the user to be deleted
    const activeUserId = req.user._id; // Assuming you have middleware to set req.user

    if (user.id.toString() !== activeUserId.toString()) {
        return res
            .status(403)
            .json(
                new ApiError(
                    403,
                    null,
                    "You are not authorized to delete this account"
                )
            );
    }

    // Your logic to delete the user's account
    await User.deleteOne({ _id: user.id });

    return res.status(200).json({ message: "Account deleted successfully" });
});

const sendMail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        // secure: flase,
        requireTLS: true,
        // service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };

    try {
        console.log(process.env.EMAIL_PASS);
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
};
//email Forgot Password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    // Generate OTP (One-Time Password)
    const generateOTP = () => {
        // Define the length of the OTP
        const otpLength = 6;

        // Generate a random OTP
        let otp = "";
        for (let i = 0; i < otpLength; i++) {
            otp += Math.floor(Math.random() * 10); // Random digit between 0 and 9
        }

        return otp;
    };
    const otp = generateOTP();
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json(new ApiError(404, null, "User not found."));
    }
    console.log(otp);
    // Encode the OTP in JWT
    // user.passwordResetOTP = otp;
    user.savedOTP = otp;
    await user.save();
    // Send the OTP via email
    try {
        console.log("its call function");
        await sendMail(
            email,
            "Password Reset OTP",
            `Your OTP for password reset is: ${otp}`
        );
        res.status(200).json(`${otp}`);
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res
            .status(500)
            .json(new ApiError(500, null, "Failed to send OTP via email"));
    }
};

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        return res
            .status(401)
            .json(new ApiError(401, null, "unauthorized request"));
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            return res
                .status(401)
                .json(new ApiError(401, null, "Invalid refresh token"));
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return res
                .status(401)
                .json(
                    new ApiError(401, null, "Refresh token is expired or used")
                );
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefereshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
        // return res.status(401).json(
        //     new ApiError(401, null, "Refresh token is expired or used" || "Invalid refresh token")
        // );
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Invalid old password"));
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { emailOrPhone, newPassword } = req.body;
    const user = await User.findOne({
        $or: [{ email: emailOrPhone }, { phoneNo: emailOrPhone }],
    });
    // const isCorrect = await user.isPasswordCorrect(oldPassword)

    if (!user) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Invalid Email write valid code"));
    }

    user.password = newPassword;

    user.otp = null;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user).select(
        "-password -refreshToken -isPhoneVerified -savedOTP"
    );
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res
            .status(400)
            .json(new ApiError(400, null, "Fields are required"));
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                username: username,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    deleteAccount,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    forgotPassword,
    resetPassword,
};
