import cloudinary from "../config/cloudinary.config.js";
import streamifier from "streamifier";
import Medicine from "../models/medicine.model.js";
import Shop from "../models/shop.model.js";

// Helper — stream buffer to Cloudinary instead of saving to disk
const streamUpload = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `medi-quick/${folder}`,
        transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const uploadMedicineImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
 
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }
 
    // Delete old image from Cloudinary if exists
    if (medicine.image?.publicId) {
      await cloudinary.uploader.destroy(medicine.image.publicId).catch(() => {}); // silent fail
    }
 
    const result = await streamUpload(req.file.buffer, "medicines");
 
    medicine.image = { url: result.secure_url, publicId: result.public_id };
    await medicine.save();
 
    res.status(200).json({
      success: true,
      message: "Medicine image uploaded",
      data: { url: result.secure_url, publicId: result.public_id },
    });
  } catch (error) {
    next(error);
  }
};

const uploadShopImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
 
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
 
    // Delete old image
    if (shop.image?.publicId) {
      await cloudinary.uploader.destroy(shop.image.publicId).catch(() => {});
    }
 
    const result = await streamUpload(req.file.buffer, "shops");
 
    shop.image = { url: result.secure_url, publicId: result.public_id };
    await shop.save();
 
    res.status(200).json({
      success: true,
      message: "Shop image uploaded",
      data: { url: result.secure_url, publicId: result.public_id },
    });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.body;
 
    if (!publicId) {
      return res.status(400).json({ success: false, message: "publicId is required" });
    }
 
    const result = await cloudinary.uploader.destroy(publicId);
 
    if (result.result !== "ok") {
      return res.status(400).json({ success: false, message: "Image deletion failed", data: result });
    }
 
    res.status(200).json({ success: true, message: "Image deleted from Cloudinary" });
  } catch (error) {
    next(error);
  }
};


const uploadController = {
  uploadMedicineImage,
  uploadShopImage,
  deleteImage,
};

export default uploadController;