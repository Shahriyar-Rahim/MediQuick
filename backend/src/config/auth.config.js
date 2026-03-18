import dotenv from "dotenv";
import jwt from "jsonwebtoken";


dotenv.config();

// encode token
const encodeToken = (email, id) => {
    const payload = { email, id };
    const key = process.env.JWT_SECRET_KEY;
    const expire = process.env.JWT_EXPIRES_IN;

    return jwt.sign(payload, key, { expiresIn: expire });
};
// decode token (verification --> for going profile)
const decodeToken = () => {};


const authConfig = {
    encodeToken,
    decodeToken,
};

export default authConfig;