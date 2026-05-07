# Medi-Quick 🏥

### A Comprehensive Healthcare Platform for Medicine, Ambulance & Blood Donation Services

![Medi-Quick Hero Screenshot](./public/screenshot.png)

> **Live Demo:** [medi-quick-fawn.vercel.app](https://medi-quick-fawn.vercel.app/)  
> **Developed by:** Md. Shahriyar Rahim  
> **Designed by:** Shammi Ayeman Mantasa  
> **Institution:** Bangladesh Army University of Science & Technology (BAUST)  
> **Department:** Computer Science & Engineering (CSE)

---

## 📌 Project Overview

**Medi-Quick** is a comprehensive community-driven healthcare platform designed to address critical healthcare inefficiencies in local communities. Beyond traditional pharmacy inventory systems, Medi-Quick combines crowdsourced medicine data with emergency response services including ambulance tracking and blood donation coordination.

The platform empowers users to:
- **Find medicines** with real-time availability and pricing from nearby pharmacies
- **Book ambulances** with GPS tracking for emergency medical transport
- **Locate blood donors** and coordinate blood donation drives
- **Contribute data** without requiring login, while maintaining integrity through community voting
- **Access research-driven insights** on medicine scarcity and price variance

### 🔍 The Research Angle (Gap Analysis)

This project serves as a comprehensive research platform to identify:
- **Medicine Scarcity:** Tracking "searched-for-but-not-found" medicines to identify supply chain gaps and healthcare access issues
- **Price Variance:** Analyzing price differences across local pharmacies for the same generic medicine
- **Stock Trends:** Monitoring which medicines are trending or running low in specific areas
- **Emergency Response Gaps:** Understanding ambulance availability and response times
- **Blood Bank Efficiency:** Tracking blood inventory and donor availability across regions

---

## ✨ Key Features

### 💊 Medicine Management
- **Interactive Map Search:** Leaflet.js-powered visualization of nearby pharmacies and their stock
- **Generic Search:** Search by brand name (e.g., Napa) to find generic equivalents (e.g., Paracetamol)
- **Crowdsourced Updates:** Users can add medicines, update prices, and modify shop details instantly
- **Price Verification:** Community-led 👍/👎 voting system for fraud detection and price accuracy
- **Live Trends Dashboard:** Real-time metrics on most-bought medicines and low-stock alerts

### 🚑 Ambulance Service
- **Real-Time Ambulance Tracking:** GPS-enabled location tracking for active ambulances
- **Quick Emergency Booking:** One-click ambulance booking with automatic dispatch
- **Driver Information:** View driver details and ambulance status before booking
- **Estimated Time of Arrival:** Real-time ETA calculations for emergency response

### 🩸 Blood Donation System
- **Blood Bank Locator:** Find nearby blood banks and their current inventory
- **Donor Registration:** Community members can register as blood donors
- **Donation Drives:** Coordinate and organize blood donation events
- **Urgent Blood Requests:** Post emergency blood requirements for quick matching

### 🔒 Security & Administration
- **Authenticated Admin Panel:** Secure dashboard for administrators to manage operations
- **Store Management:** Add, edit, or remove pharmacy/ambulance/blood bank information
- **Fraud Prevention:** Remove fraudulent entries and verify authenticity
- **Permission Controls:** Toggle public editing permissions per region or facility

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React.js, Vite, Tailwind CSS, Leaflet.js (Maps) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB |
| **Image Processing** | HEIC support, Image compression, OCR capabilities |
| **AI/ML** | Machine learning models for predictions |
| **Deployment** | Vercel (Frontend), Custom server (Backend) |

### Recent Enhancements (v7+)
- **Satellite Map Integration:** Enhanced mapping with satellite imagery
- **OCR Updates:** Improved prescription scanning capabilities
- **Image Optimization:** HEIC image format support and compression
- **Ambulance & Blood System:** Complete module integration
- **Theme Enhancement:** Redesigned UI for unified healthcare platform

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- MongoDB database (local or Atlas)
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Shahriyar-Rahim/MediQuick.git
cd MediQuick
```

#### 2. Install Dependencies

**Frontend Setup:**
```bash
cd frontend
npm install
```

**Backend Setup:**
```bash
cd ../server
npm install
```

#### 3. Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string

# JWT Authentication
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# API Configuration
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Optional: External Services
MAPBOX_API_KEY=your_mapbox_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

For frontend, create `.env.local` in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_MAPBOX_API_KEY=your_mapbox_key
```

#### 4. Run the Application

**Start Backend Server:**
```bash
cd server
npm start
```
The backend will run on `http://localhost:5000`

**Start Frontend Development Server (in another terminal):**
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`

### Production Build

**Frontend Build:**
```bash
cd frontend
npm run build
```

**Backend Deployment:**
```bash
cd server
npm start
```
(Ensure NODE_ENV is set to production)

---

## 📁 Project Structure

```
MediQuick/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.jsx          # Main app component
│   └── package.json
│
├── server/                   # Node.js + Express backend
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth and custom middleware
│   └── server.js            # Entry point
│
└── README.md
```

---

## 🔄 API Endpoints Overview

### Medicine Endpoints
- `GET /api/medicines` - List all medicines
- `POST /api/medicines` - Add new medicine
- `GET /api/medicines/:id` - Get medicine details
- `PUT /api/medicines/:id` - Update medicine info
- `DELETE /api/medicines/:id` - Remove medicine

### Pharmacy Endpoints
- `GET /api/pharmacies` - List all pharmacies
- `POST /api/pharmacies` - Register new pharmacy
- `GET /api/pharmacies/nearby?lat=X&lng=Y` - Find nearby pharmacies

### Ambulance Endpoints
- `GET /api/ambulances` - List available ambulances
- `POST /api/ambulances/book` - Book ambulance
- `GET /api/ambulances/:id/location` - Real-time ambulance location
- `PATCH /api/ambulances/:id/status` - Update ambulance status

### Blood Bank Endpoints
- `GET /api/blood-banks` - List blood banks
- `GET /api/blood-inventory` - Check blood availability
- `POST /api/blood-requests` - Post emergency blood request
- `POST /api/donor-registration` - Register as blood donor

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/admin-login` - Admin login
- `POST /auth/logout` - User logout

---

## 🔐 Authentication & Authorization

MediQuick implements a robust JWT-based authentication system:

### Public Features
- View medicine availability and pricing
- Search pharmacies and blood banks
- Browse ambulance services
- Create requests without account

### Authenticated Users
- Save favorite stores/services
- Track booking history
- Manage personal information
- Rate and review services

### Admin Capabilities
- Manage all entities (medicines, pharmacies, ambulances, blood banks)
- Remove fraudulent entries
- View analytics and reports
- Control platform-wide settings
- Moderate community contributions

---

## 🗺️ Roadmap

- [x] Core medicine inventory and pricing system
- [x] Interactive map with Leaflet.js
- [x] Ambulance booking and tracking
- [x] Blood donation system
- [x] Image compression and HEIC support
- [x] OCR for prescription scanning
- [ ] **AI-Driven Predictions:** Machine learning models for medicine shortage forecasting
- [ ] **Advanced Analytics:** Detailed reports on healthcare trends and accessibility
- [ ] **Multi-Language Support:** Localization for Bengali, English, and regional languages
- [ ] **Mobile Application:** React Native app for iOS and Android
- [ ] **SMS Notifications:** Alert system for urgent blood requests and ambulance bookings
- [ ] **Integration with National Health Database:** Sync with government health records
- [ ] **Prescription Management:** Digital prescription storage and management
- [ ] **Insurance Integration:** Direct insurance claim processing

---

## 🔧 Configuration & Customization

### Map Configuration
Customize map behavior in `frontend/src/config/mapConfig.js`:
- Default zoom levels
- Center coordinates
- Tile providers
- Custom markers

### Theme Customization
Modify the color scheme in `frontend/src/config/theme.js` or Tailwind configuration.

### Database Indexes
Ensure MongoDB indexes are created for optimal performance:
```bash
cd server
npm run seed:indexes
```

---

## 📊 Performance Optimization

- **Frontend:** Code splitting, lazy loading, image optimization (via compression)
- **Backend:** Database indexing, caching, query optimization
- **Maps:** Marker clustering, lazy polygon loading
- **Images:** HEIC format support and automatic compression

---

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# On macOS/Linux
lsof -i :5000
kill -9 <PID>

# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**MongoDB Connection Error**
- Verify `MONGO_URI` in `.env`
- Ensure MongoDB service is running
- Check network connectivity for Atlas

**Frontend Not Connecting to Backend**
- Verify `VITE_API_URL` in frontend `.env.local`
- Ensure backend is running on the specified port
- Check CORS configuration in backend

**Image Upload Issues**
- Verify file size limits in backend config
- Ensure `/uploads` directory exists and has write permissions
- Check supported image formats (JPEG, PNG, HEIC)

---

## 📝 Contributing Guidelines

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/YourFeature`
3. **Commit your changes:** `git commit -m 'Add YourFeature'`
4. **Push to branch:** `git push origin feature/YourFeature`
5. **Submit a Pull Request**

### Code Standards
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Test changes before submitting PR

---

## 📄 License & Academic Use

This project is developed for academic purposes as part of the final year project showcase at the **Bangladesh Army University of Science & Technology (BAUST)**, Department of Computer Science & Engineering.

**Terms:**
- Free for educational and research purposes
- Attribution required when referencing this project
- Not intended for commercial use without explicit permission

---

## 📞 Contact & Support

- **Developer:** Md. Shahriyar Rahim  
  Email: [rahimislam420.ri35@gmail.com](mailto:rahimislam420.ri35@gmail.com)  
  GitHub: [@Shahriyar-Rahim](https://github.com/Shahriyar-Rahim)

- **Designer:** Shammi Ayeman Mantasa

- **Project Issues:** [GitHub Issues](https://github.com/Shahriyar-Rahim/MediQuick/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Shahriyar-Rahim/MediQuick/discussions)

---

## 🙏 Acknowledgments

- **BAUST** for academic support and resources
- **Leaflet.js** for open-source mapping
- **MongoDB** for database services
- **Vercel** for hosting infrastructure
- **Community Contributors** for crowdsourced data

---

**Last Updated:** May 7, 2026  
**Current Version:** 7.x (with Ambulance & Blood Donation Systems)

⭐ If you find this project helpful, please consider giving it a star on GitHub!
