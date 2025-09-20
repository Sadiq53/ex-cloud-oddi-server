const { z } = require("zod");

const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  userpass: z.string().min(1, "Password is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone number is required"),
  profilepic: z.string().optional(),
  role: z.enum(["superadmin", "admin", "supervisor"])
});

module.exports = userSchema