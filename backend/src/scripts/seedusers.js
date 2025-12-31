const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")

const { User } = require("../models/User")
const { connectDB } = require("../config/db")

dotenv.config()

const seedUsers = async () => {
  try {
    await connectDB()

    await User.deleteMany({
      enrollmentId: { $in: ["ENR001", "VOT001"] }
    })

    const passwordHash = await bcrypt.hash("password", 10)

    const users = [
      {
        fullName: "Test Candidate",
        email: "candidate@college.edu",
        mobile: "9000000001",
        enrollmentId: "ENR001",
        role: "CANDIDATE",
        passwordHash,
        isVerified: true,
        isApproved: true
      },
      {
        fullName: "Test Voter",
        email: "voter@college.edu",
        mobile: "9000000002",
        enrollmentId: "VOT001",
        role: "VOTER",
        passwordHash,
        isVerified: true,
        isApproved: true
      }
    ]

    await User.insertMany(users)

    console.log("✅ Candidate & Voter seeded successfully")
    console.log("Candidate → ENR001 / password")
    console.log("Voter → VOT001 / password")

    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  }
}

seedUsers()
