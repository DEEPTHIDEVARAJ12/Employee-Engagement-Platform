import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['Admin', 'HR', 'Employee'],
      default: 'Employee',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    department: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Keep legacy isActive and status in sync.
UserSchema.pre('save', function (next) {
  if (this.status === 'Inactive') this.isActive = false
  if (this.status === 'Active') this.isActive = true
  if (this.isActive === false) this.status = 'Inactive'
  if (this.isActive === true) this.status = 'Active'
  next()
})

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcryptjs.genSalt(10)
    this.password = await bcryptjs.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password)
}

export default mongoose.model('RBACUser', UserSchema)
