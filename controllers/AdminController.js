require("dotenv").config();
const router = require("express").Router();
const adminClient = require("../models/Admin");
const jwt = require("jsonwebtoken");
const { validatePassword, hashPassword } = require("../utils/auth")
const userSchema = require("../schemas/userSchema");

router.get("/authentication/signup/find", async (req, res) => {
    const response_signup_find = await adminClient.findAll();
    return res.status(200).json(response_signup_find)
})


router.post("/authentication/signup", async (req, res) => {

    const signupUser = {
        username: "admin",
        userpass: await hashPassword("1"),
        name: "Root Admin",
        role: "superadmin",
        email: "admin@oddiville.com",
        phone: "1234567890",
        profilepic: "https://95c55a994d16.ngrok-free.app/profilepic/K7b1A9xGmEwZ3uYJqPTFhV20cdNsXoQnMBiRKe5L8tzrCJHgWvUpafSODl9y6Bk4EN.png",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }

    // const signupUser = {
    //     username: "supervisor.oddiville",
    //     userpass: await hashPassword("1"),
    //     name: "Anand Mehta",
    //     role: "supervisor",
    //     email: "manager@oddiville.com",
    //     phone: "+919876543210",
    //     profilepic: "https://95c55a994d16.ngrok-free.app/profilepic/lokqkDWgwjg$oQFFOgrigeoho5h95hoofa0fa303kfskkKFJjOJOJSFJAEFJ.png",
    //     createdAt: Date.now(),
    //     updatedAt: Date.now(),
    // }
 
    try {
        const response_signup_create = await adminClient.create(signupUser);
        const admin = response_signup_create.dataValues;

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables.");
            return res.status(500).json({ error: "Server configuration error." });
        }

        const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET)
        return res.status(200).json({ token });
    } catch (error) {
        console.error("Error during authentication:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.post("/authentication/login", async (req, res) => {
    let { email, userpass } = req.body;
    if (!email || !userpass) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const response_login_find = await adminClient.findOne({ where: { email } });
        if (!response_login_find || response_login_find.length === 0) {
            return res.status(401).json({ error: "Email or password is not valid." });
        }

        const admin = response_login_find.dataValues;
        if (typeof userpass !== 'string' || typeof admin.userpass !== 'string') {
            return res.status(400).json({ error: "Invalid password format" });
        }

        const passwordMatch = await validatePassword(userpass, admin.userpass);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Username or password is not valid." });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables.");
            return res.status(500).json({ error: "Server configuration error." });
        }
        const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET);
        return res.status(200).json({ token, authData: response_login_find });
    } catch (error) {
        console.error("Error during authentication:", error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.get("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Authorization token is missing." });
    }
    const token = authHeader.split(" ")[1].trim();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        const response_signup_find = await adminClient.findOne({ where: { email } });

        return res.status(200).json(response_signup_find);
    } catch (error) {
        console.error("JWT verification failed:", error.message);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
});

// router.post("/authentication/signup", async (req, res) => {
//     // const signupUser = {
//     //     username: "admin",
//     //     userpass: await hashPassword("1"),
//     //     name: "Root Admin",
//     //     role: "superadmin",
//     //     email: "admin@oddiville.com",
//     //     phone: "1234567890",
//     //     profilepic: "https://9714-2402-8100-2731-9da3-b876-7c59-bc39-c713.ngrok-free.app/profilepic/K7b1A9xGmEwZ3uYJqPTFhV20cdNsXoQnMBiRKe5L8tzrCJHgWvUpafSODl9y6Bk4EN.png",
//     //     createdAt: Date.now(),
//     //     updatedAt: Date.now(),
//     // }
//     const signupUser = {
//         username: "supervisor.oddiville",
//         userpass: await hashPassword("1"),
//         name: "Anand Mehta",
//         role: "supervisor",
//         email: "manager@oddiville.com",
//         phone: "+919876543210",
//         profilepic: "https://9714-2402-8100-2731-9da3-b876-7c59-bc39-c713.ngrok-free.app/profilepic/lokqkDWgwjg$oQFFOgrigeoho5h95hoofa0fa303kfskkKFJjOJOJSFJAEFJ.png",
//         createdAt: Date.now(),
//         updatedAt: Date.now(),
//     }
//     try {
//         const response_signup_create = await adminClient.create(signupUser);
//         const admin = response_signup_create.dataValues;
//         if (!process.env.JWT_SECRET) {
//             console.error("JWT_SECRET is not defined in environment variables.");
//             return res.status(500).json({ error: "Server configuration error." });
//         }
//         const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET)
//         return res.status(200).json({ token });
//     } catch (error) {
//         console.error("Error during authentication:", error);
//         return res.status(500).json({ error: "Internal server error." });
//     }
// });

router.post("/users", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization token is missing." });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables.");
            return res.status(500).json({ error: "Server configuration error." });
        }

        const token = authHeader.split(" ")[1].trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const authenticatedUser = await adminClient.findOne({ where: { email: decoded.email } });
        if (!authenticatedUser || authenticatedUser.role !== "superadmin") {
            return res.status(403).json({ error: "Only superadmins can create new users." });
        }

        const parsed = userSchema.parse(req.body);

        const existingUser = await adminClient.findOne({
            where: { username: parsed.username },
        });

        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const newAdmin = await adminClient.create({
            ...parsed,
            role: parsed.role || "supervisor"
        });

        return res.status(201).json({
            message: "Admin user created successfully",
            data: newAdmin,
        });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: error.errors[0].message });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token has expired" });
        }

        console.error("Error adding user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
