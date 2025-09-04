import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { name, email, password, mobileNumber, fatherName } = req.body;
  try {
    if (!name || !email || !password || !mobileNumber || !fatherName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      fatherName
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        fatherName: newUser.fatherName,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, removeProfilePic, deleteCertificateId, certificates, skills, skillsToLearn } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle profile picture operations
    if (removeProfilePic) {
      if (user.profilePic) {
        const publicId = getPublicIdFromUrl(user.profilePic);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
        user.profilePic = "";
      }
    } else if (profilePic) {
      // Delete old profile pic if exists
      if (user.profilePic) {
        const publicId = getPublicIdFromUrl(user.profilePic);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      user.profilePic = uploadResponse.secure_url;
    }

    // Handle certificate deletion
    if (deleteCertificateId) {
      const certificate = user.certificates.find(
        cert => cert._id.toString() === deleteCertificateId
      );
      if (certificate) {
        const publicId = getPublicIdFromUrl(certificate.fileUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
        user.certificates = user.certificates.filter(
          cert => cert._id.toString() !== deleteCertificateId
        );
      }
    }

    // Handle certificate updates
    if (certificates) {
      // If it's a new certificate being added
      if (certificates.length > user.certificates.length) {
        const newCertificate = certificates[certificates.length - 1];
        if (newCertificate.fileUrl.startsWith('data:')) {
          // Upload new certificate to cloudinary
          const uploadResponse = await cloudinary.uploader.upload(newCertificate.fileUrl);
          newCertificate.fileUrl = uploadResponse.secure_url;
          user.certificates.push(newCertificate);
        }
      } else {
        // If it's a complete update of certificates array
        user.certificates = certificates;
      }
    }

    // Handle skills update
    if (skills) {
      user.skills = skills;
    }

    // Handle skills to learn update
    if (skillsToLearn) {
      user.skillsToLearn = skillsToLearn;
    }

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Find all users except the current user
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password"); // Exclude password field
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getAllUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
