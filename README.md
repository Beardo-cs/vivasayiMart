# 🌾 VivasayiMart - Farmers Marketplace Platform

<div align="center">

**A Modern MERN Stack Application Connecting Farmers Directly with Buyers**

[![MongoDB](https://img.shields.io/badge/MongoDB-9.1.6-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5.2.1-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node-Latest-green.svg)](https://nodejs.org/)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://ai.google.dev/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-documentation) • [Deployment](#-deployment)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**VivasayiMart** (Tamil: விவசாயி மார்ட் - Farmer's Market) is a comprehensive digital marketplace platform designed to revolutionize agricultural commerce by directly connecting farmers with buyers. Built with the MERN stack and powered by Google Gemini AI, it eliminates middlemen, ensures fair pricing, and empowers farmers with modern technology.

### 🎯 Mission

Empower farmers with digital tools to:
- Reach buyers directly without intermediaries
- Get fair market prices for their produce
- Leverage AI for product identification and pricing
- Build sustainable agricultural businesses

### 🏆 Key Highlights

- **AI-Powered**: Google Gemini AI for automatic product detection and price suggestions
- **Real-time**: Instant product listings and updates
- **Secure**: JWT-based authentication with bcrypt password hashing
- **Scalable**: Built on modern MERN stack with serverless deployment
- **Mobile-First**: Responsive design for farmers on-the-go
- **Production-Ready**: Deployed on Vercel with MongoDB Atlas

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Secure Registration** - Email validation, password hashing with bcrypt
- **JWT Authentication** - Token-based secure sessions
- **Protected Routes** - Role-based access control
- **Persistent Sessions** - Auto-login with stored tokens
- **Gravatar Integration** - Automatic profile pictures

### 👨‍🌾 Farmer Profiles
- **Comprehensive Profiles** - Bio, location, farming specializations
- **Experience Tracking** - Farming experience history
- **Portfolio** - Showcase farming expertise
- **Public Directory** - Browse all registered farmers

### 🛒 Product Marketplace
- **Product Listings** - Create detailed agricultural product posts
- **Rich Information** - Product name, description, weight, price, location
- **Image Support** - Upload product images (base64 encoded)
- **Auto-Calculation** - Automatic total amount calculation (weight × price)
- **Contact Details** - Direct farmer contact information
- **Real-time Updates** - Instant product availability

### 🤖 AI-Powered Features (Google Gemini)
- **Smart Product Detection** - Upload image → AI identifies the product
- **Automatic Categorization** - AI determines product category
- **Quality Assessment** - AI evaluates product quality (Premium/Good/Average)
- **Price Suggestions** - Location-based market price recommendations
- **Confidence Scoring** - AI confidence level for accuracy
- **Auto-fill Forms** - Detected information auto-populates forms

### 💬 Social Features
- **Comments** - Discuss products and farming practices
- **User Interactions** - Connect with other farmers and buyers
- **Activity Feed** - Latest products and updates
- **Notifications** - Real-time alerts for interactions

### 📊 Dashboard
- **Personal Dashboard** - Overview of your products and activity
- **Product Management** - Create, edit, delete your listings
- **Profile Management** - Update your farmer profile
- **Analytics** - View your product performance

### 🌐 Additional Features
- **Market Price Checker** - Check current market prices
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Search & Filter** - Find specific products or farmers
- **Location-based** - Filter by geographical area
- **Multi-language Ready** - Prepared for Tamil/English localization

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3.1 | UI library for building interactive interfaces |
| **React Router** | 7.13.0 | Client-side routing and navigation |
| **Redux Toolkit** | 2.11.2 | State management with modern Redux |
| **Redux Thunk** | 3.1.0 | Async action handling |
| **Axios** | 1.13.4 | HTTP client for API requests |
| **Moment.js** | 2.30.1 | Date/time formatting |
| **React Moment** | 1.2.1 | React wrapper for Moment.js |
| **UUID** | 13.0.0 | Unique ID generation |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | Latest | JavaScript runtime |
| **Express** | 5.2.1 | Web application framework |
| **MongoDB** | 9.1.6 | NoSQL database |
| **Mongoose** | 9.1.6 | MongoDB ODM |
| **JWT** | 9.0.3 | JSON Web Token authentication |
| **Bcrypt.js** | 3.0.3 | Password hashing |
| **Express Validator** | 7.3.1 | Request validation |
| **Multer** | 2.0.2 | File upload handling |
| **CORS** | 2.8.6 | Cross-origin resource sharing |

### AI & External Services
| Service | Version | Purpose |
|---------|---------|---------|
| **Google Gemini AI** | 1.40.0 | Product detection & price suggestions |
| **Gravatar** | 1.8.2 | Profile picture service |
| **MongoDB Atlas** | Cloud | Database hosting |
| **Vercel** | Latest | Serverless deployment platform |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| **Concurrently** | 9.2.1 | Run multiple commands simultaneously |
| **Nodemon** | 3.1.11 | Auto-restart server on changes |
| **Config** | 4.2.0 | Configuration management |

---

## 🏗️ Architecture

```
VivasayiMart/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/
│       ├── actions/       # Redux actions
│       ├── components/    # React components
│       ├── reducers/      # Redux reducers
│       ├── utils/         # Utility functions (API config)
│       └── App.js         # Main React component
├── config/                # Configuration files
│   ├── db.js             # MongoDB connection
│   └── default.json      # Config variables (DO NOT COMMIT)
├── middleware/            # Express middleware
│   └── auth.js           # JWT authentication middleware
├── models/               # Mongoose schemas
│   ├── User.js          # User model
│   ├── Profile.js       # Farmer profile model
│   └── Post.js          # Product listing model
├── routes/              # API routes
│   └── api/
│       ├── auth.js      # Authentication routes
│       ├── users.js     # User registration
│       ├── profile.js   # Profile management
│       ├── posts.js     # Product listings
│       └── ai.js        # AI integration
├── services/            # Business logic
│   └── geminiService.js # Google Gemini AI service
├── server.js            # Express server entry point
├── vercel.json          # Vercel deployment config
└── package.json         # Dependencies

```

### Data Flow

1. **User Authentication**: Client → `/api/auth` → JWT Token → Protected Routes
2. **Product Creation**: Client → `/api/posts` → MongoDB → Real-time Update
3. **AI Detection**: Image Upload → `/api/ai/analyze-product` → Gemini AI → Auto-fill Form
4. **Price Suggestion**: Location Data → `/api/ai/suggest-price` → Gemini AI → Price Recommendation

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Google Gemini API Key** - [Get API Key](https://aistudio.google.com/app/apikey)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Beardo-cs/vivasayiMart.git
cd vivasayiMart
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure Environment Variables

Create `config/default.json` from the example template:

```bash
cp config/default.example.json config/default.json
```

Edit `config/default.json` with your credentials:

```json
{
  "mongoURI": "your_mongodb_atlas_connection_string",
  "jwtSecret": "your_jwt_secret_key",
  "geminiApiKey": "your_google_gemini_api_key",
  "githubClientId": "your_github_oauth_client_id",
  "githubSecret": "your_github_oauth_secret"
}
```

**⚠️ IMPORTANT**: Never commit `config/default.json` to Git! It's already in `.gitignore`.

---

## ⚙️ Configuration

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user with password
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```
6. Add it to `config/default.json` as `mongoURI`

### Google Gemini AI Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add it to `config/default.json` as `geminiApiKey`

**See [GEMINI_AI_SETUP.md](GEMINI_AI_SETUP.md) for detailed AI integration guide.**

### JWT Secret

Generate a secure random string for JWT:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add it to `config/default.json` as `jwtSecret`.

---

## 💻 Usage

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000

### Run Backend Only

```bash
npm run server
```

### Run Frontend Only

```bash
npm run client
```

### Production Build

```bash
npm run build
```

This creates an optimized production build in `client/build/`.

---

## 📱 Using the Application

### For Farmers

1. **Register**: Create an account with email and password
2. **Create Profile**: Add your farming details and experience
3. **List Products**:
   - Click "Posts" in navigation
   - Upload product image (AI will detect it!)
   - Fill in details (or let AI auto-fill)
   - Submit listing
4. **Manage Listings**: View, edit, or delete your products from dashboard
5. **Interact**: Respond to comments from buyers

### For Buyers

1. **Browse Products**: View all available agricultural products
2. **Search Farmers**: Find farmers by location or specialization
3. **Contact Farmers**: Use mobile number or comments to connect
4. **Check Prices**: Use market price checker for fair pricing
5. **Leave Comments**: Ask questions about products

---

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/users
Content-Type: application/json

{
  "name": "Farmer Name",
  "email": "farmer@example.com",
  "password": "securepassword"
}
```

**Response**: JWT token

#### Login
```http
POST /api/auth
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "securepassword"
}
```

**Response**: JWT token

#### Get Current User
```http
GET /api/auth
Authorization: Bearer <token>
```

**Response**: User object (without password)

---

### Profile Endpoints

#### Get Current User's Profile
```http
GET /api/profile/me
Authorization: Bearer <token>
```

#### Create/Update Profile
```http
POST /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "company": "Farm Name",
  "location": "Village, District, State",
  "status": "Farmer",
  "skills": "Rice, Wheat, Vegetables",
  "bio": "Experienced organic farmer",
  "experience": [...]
}
```

#### Get All Profiles
```http
GET /api/profile
```

#### Get Profile by User ID
```http
GET /api/profile/user/:user_id
```

---

### Product (Posts) Endpoints

#### Get All Products
```http
GET /api/posts
Authorization: Bearer <token>
```

#### Get Product by ID
```http
GET /api/posts/:id
Authorization: Bearer <token>
```

#### Create Product Listing
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Fresh organic tomatoes",
  "farmerName": "Farmer Name",
  "productName": "Tomatoes",
  "mobileNumber": "9876543210",
  "productImage": "base64_encoded_image_or_url",
  "weight": 50,
  "price": 30,
  "address": "Village, District, State"
}
```

**Note**: `totalAmount` is auto-calculated as `weight × price`

#### Delete Product
```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

#### Add Comment
```http
POST /api/posts/comment/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Is this product still available?"
}
```

#### Delete Comment
```http
DELETE /api/posts/comment/:id/:comment_id
Authorization: Bearer <token>
```

---

### AI Endpoints

#### Analyze Product Image
```http
POST /api/ai/analyze-product
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "base64_encoded_image",
  "address": "Optional location for price suggestion"
}
```

**Response**:
```json
{
  "productName": "Tomatoes",
  "category": "Vegetables",
  "quality": "Premium",
  "confidence": 0.95,
  "suggestedPrice": 35
}
```

#### Get Price Suggestion
```http
POST /api/ai/suggest-price
Authorization: Bearer <token>
Content-Type: application/json

{
  "productName": "Tomatoes",
  "location": "Tamil Nadu"
}
```

**Response**:
```json
{
  "suggestedPrice": 35,
  "priceRange": {
    "min": 25,
    "max": 45
  },
  "marketTrend": "stable"
}
```

---

## 🚢 Deployment

### Deploy to Vercel

This application is configured for serverless deployment on Vercel.

#### Prerequisites
- Vercel account ([sign up](https://vercel.com/signup))
- Vercel CLI installed: `npm i -g vercel`

#### Steps

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Link Project**
   ```bash
   vercel link
   ```

3. **Add Environment Variables**

   Go to Vercel Dashboard → Your Project → Settings → Environment Variables

   Add these variables:
   - `mongoURI` - Your MongoDB Atlas connection string
   - `jwtSecret` - Your JWT secret key
   - `geminiApiKey` - Your Google Gemini API key
   - `githubClientId` - (Optional) GitHub OAuth client ID
   - `githubSecret` - (Optional) GitHub OAuth secret

4. **Deploy**
   ```bash
   vercel --prod
   ```

**See [VERCEL_SETUP.md](VERCEL_SETUP.md) for detailed deployment guide.**

### Important Notes

- The app uses Express 5 which requires `app.use()` instead of `app.get('*')` for catch-all routes
- Environment variables must be set in Vercel dashboard (config files don't work in serverless)
- MongoDB connection uses connection pooling for serverless optimization
- Static files are served from `client/build/`

---

## 🔒 Security

### Best Practices Implemented

✅ **Password Security**: Bcrypt hashing with salt rounds
✅ **JWT Tokens**: Secure token-based authentication
✅ **Input Validation**: Express Validator for all inputs
✅ **CORS Protection**: Configured CORS middleware
✅ **Environment Variables**: Sensitive data in config files (not committed)
✅ **MongoDB Injection Prevention**: Mongoose sanitization
✅ **XSS Protection**: React's built-in XSS protection

### Security Warnings

⚠️ **NEVER commit sensitive files**:
- `config/default.json`
- `.env` files
- Any file containing passwords, API keys, or secrets

⚠️ **If secrets are exposed in Git history**:
1. Read [SECURITY_CLEANUP.md](SECURITY_CLEANUP.md)
2. Run `./clean-git-history.sh` to wipe history
3. Rotate all exposed secrets immediately

### Rotating Secrets

If your secrets are compromised:

1. **MongoDB**: Change password in MongoDB Atlas
2. **JWT**: Generate new secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
3. **Gemini AI**: Delete and create new API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
4. **GitHub OAuth**: Regenerate client secret at [GitHub Settings](https://github.com/settings/developers)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation if needed
- Never commit sensitive information

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Mahendiran M**

- GitHub: [@Beardo-cs](https://github.com/Beardo-cs)
- Project: [VivasayiMart](https://github.com/Beardo-cs/vivasayiMart)

---

## 🙏 Acknowledgments

- **Google Gemini AI** - For powerful AI capabilities
- **MongoDB Atlas** - For reliable cloud database hosting
- **Vercel** - For seamless serverless deployment
- **React Community** - For excellent documentation and tools
- **Express.js** - For robust backend framework

---

## 📞 Support

For issues, questions, or suggestions:

1. **GitHub Issues**: [Create an issue](https://github.com/Beardo-cs/vivasayiMart/issues)
2. **Documentation**: Check [GEMINI_AI_SETUP.md](GEMINI_AI_SETUP.md), [VERCEL_SETUP.md](VERCEL_SETUP.md), [SECURITY_CLEANUP.md](SECURITY_CLEANUP.md)

---

## 🗺️ Roadmap

### Planned Features

- [ ] Multi-language support (Tamil, Hindi, English)
- [ ] Real-time chat between farmers and buyers
- [ ] Payment gateway integration
- [ ] Order management system
- [ ] Delivery tracking
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Weather integration for farmers
- [ ] Crop disease detection using AI
- [ ] Market trend predictions

---

<div align="center">

**Made with ❤️ for Farmers**

🌾 **VivasayiMart** - Empowering Agriculture Through Technology 🌾

</div>

