const mongoose = require("mongoose");
const Admin = require("../models/admin.js");

const Mongo_URL = "mongodb://localhost:27017/Nestify";

const adminData = {
    username: process.env.SUPER_ADMIN_USERNAME || "Super Admin",
    email: process.env.SUPER_ADMIN_EMAIL || "admin@nestify.com",
    password: process.env.SUPER_ADMIN_PASSWORD || "admin12345",
};

async function main() {
    await mongoose.connect(Mongo_URL);

    const existingSuperAdmin = await Admin.findOne({ role: "super-admin" });

    if (existingSuperAdmin) {
        console.log("Super admin already exists.");
        return;
    }

    const admin = new Admin({
        username: adminData.username,
        email: adminData.email,
        role: "super-admin",
    });

    await Admin.register(admin, adminData.password);
    console.log(`Super admin created: ${adminData.email}`);
}

main()
    .catch((err) => {
        console.log("Error creating super admin:", err.message);
    })
    .finally(() => {
        mongoose.connection.close();
    });
