// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const UserSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Name is required'],
//     trim: true,
//     minlength: [2, 'Name must be at least 2 characters'],
//     maxlength: [50, 'Name cannot exceed 50 characters']
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     trim: true,
//     match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [8, 'Password must be at least 8 characters'],
//     select: false // Don't return password by default
//   },
//   role: {
//     type: String,
//     enum: ['user', 'admin'],
//     default: 'user'
//   },
//   isVerified: {
//     type: Boolean,
//     default: false
//   },
//   otp: {
//     code: {
//       type: String,
//       select: false
//     },
//     expiresAt: {
//       type: Date,
//       select: false
//     }
//   },
//   profile: {
//     branch: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Branch'
//     },
//     semester: {
//       type: Number,
//       min: 1,
//       max: 8
//     },
//     enrollmentNumber: String,
//     avatar: String
//   },
//   preferences: {
//     theme: {
//       type: String,
//       enum: ['light', 'dark', 'system'],
//       default: 'light'
//     },
//     notifications: {
//       type: Boolean,
//       default: true
//     }
//   },
//   lastLogin: Date,
//   resetPasswordToken: String,
//   resetPasswordExpires: Date
// }, {
//   timestamps: true
// });

// // Indexes
// UserSchema.index({ email: 1 });
// UserSchema.index({ role: 1 });
// UserSchema.index({ 'profile.branch': 1, 'profile.semester': 1 });
// UserSchema.index({ isVerified: 1 });

// // Hash password before saving
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();

//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Method to compare password
// UserSchema.methods.comparePassword = async function(candidatePassword) {
//   try {
//     return await bcrypt.compare(candidatePassword, this.password);
//   } catch (error) {
//     throw new Error('Password comparison failed');
//   }
// };

// // Method to generate OTP
// UserSchema.methods.generateOTP = function() {
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   this.otp = {
//     code: otp,
//     expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
//   };
//   return otp;
// };

// // Method to verify OTP
// UserSchema.methods.verifyOTP = function(candidateOTP) {
//   if (!this.otp || !this.otp.code) {
//     return false;
//   }

//   if (this.otp.expiresAt < new Date()) {
//     return false;
//   }

//   return this.otp.code === candidateOTP;
// };

// export default mongoose.models.User || mongoose.model('User', UserSchema);
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      code: {
        type: String,
        select: false,
      },
      expiresAt: {
        type: Date,
        select: false,
      },
    },

    profile: {
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
      semester: {
        type: Number,
        min: 1,
        max: 8,
      },
      enrollmentNumber: String,
      avatar: String,
    },

    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "light",
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },

    lastLogin: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  },
);

/* -------------------- INDEXES -------------------- */
// Note: email has unique: true which already creates an index
UserSchema.index({ role: 1 });
UserSchema.index({ "profile.branch": 1, "profile.semester": 1 });
UserSchema.index({ isVerified: 1 });

/* -------------------- PRE SAVE (PASSWORD HASH) -------------------- */
/**
 * IMPORTANT:
 * Async middleware → NO next()
 * Modern mongoose behaviour
 */
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/* -------------------- METHODS -------------------- */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  };

  return otp;
};

UserSchema.methods.verifyOTP = function (candidateOTP) {
  if (!this.otp?.code) return false;
  if (this.otp.expiresAt < new Date()) return false;

  return this.otp.code === candidateOTP;
};

/* -------------------- EXPORT -------------------- */
export default mongoose.models.User || mongoose.model("User", UserSchema);
