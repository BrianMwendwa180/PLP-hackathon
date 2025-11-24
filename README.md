# TerraLink

TerraLink is a comprehensive land management platform designed to revolutionize sustainable agriculture through AI-powered insights, real-time monitoring, and data-driven decision-making. It enables users to track soil health, monitor restoration activities, manage land parcels, receive degradation alerts, and generate personalized recommendations for optimal land use.

## Features

- **User Authentication & Management**: Secure login, user profiles, and impact tracking with JWT-based authentication.
- **Land Parcel Management**: Create, view, edit, and delete land parcels with geospatial data integration via Google Earth Engine.
- **Soil Health Monitoring**: Track soil vitality scores, record historical data, and visualize trends.
- **IoT Sensor Dashboard**: Real-time monitoring of environmental sensors for temperature, moisture, and other metrics.
- **AI-Powered Recommendations**: Generate tailored restoration and optimization suggestions using OpenAI integration.
- **Image Analysis**: Upload and analyze satellite or drone images for degradation detection and health assessment.
- **Restoration Activity Tracker**: Log and monitor restoration efforts, track progress, and measure impact.
- **Degradation Alerts**: Automated alerts for potential land degradation issues with resolution tracking.
- **Impact Metrics & Reporting**: Visualize key metrics (vitality scores, active alerts, impact points) and export reports in CSV or PDF formats.
- **Real-Time Updates**: Live notifications and data syncing via WebSockets (Socket.io).
- **Dashboard & Analytics**: Centralized dashboard for overview stats, recent parcels, and quick actions.
- **Background Processing**: Asynchronous handling of heavy tasks like AI analysis and data processing.

## Tech Stack

### Frontend
- **Framework**: React  with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Database/Client**: Supabase (for auth and real-time)
- **Networking**: Axios
- **Real-Time**: Socket.io-client
- **UI Components**: Lucide React icons
- **Exports**: jsPDF for PDF, custom CSV export
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt
- **AI/ML**: OpenAI API, Google Earth Engine
- **File Uploads**: Multer
- **Real-Time**: Socket.io
- **Caching**: Node-cache
- **Logging**: Morgan
- **Testing**: Jest with Supertest and MongoDB Memory Server
- **Environment**: dotenv for configuration

### Other Tools
- **Linting**: ESLint
- **PostCSS**: Autoprefixer
- **Package Manager**: pnpm

## Prerequisites

- Node.js (v18+)
- MongoDB (local or cloud, e.g., MongoDB Atlas)
- Supabase account (for client auth)
- Google Earth Engine account and API credentials
- OpenAI API key
- pnpm (recommended)

## Setup Instructions

### Backend (Server)

1. Clone the repository and navigate to the `server` directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Create a `.env` file in the `server` directory and add the following (replace with your values):
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_key
   GOOGLE_EARTH_ENGINE_ACCOUNT=your_gee_email
   GOOGLE_EARTH_ENGINE_PRIVATE_KEY=your_gee_private_key_path_or_content
   CLIENT_URL=http://localhost:5173
   ```

4. Start the development server:
   ```
   pnpm dev
   ```
   The server will run on `http://localhost:5000`. Check `/health` endpoint for status.

### Frontend (Client)

1. Navigate to the `client` directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Create a `.env` file in the `client` directory and add:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```
   pnpm dev
   ```
   The app will run on `http://localhost:5173`.

### Database Setup

- The backend uses MongoDB. Ensure your `MONGODB_URI` points to a valid instance.
- For local development, you can use MongoDB Compass or a local server.
- Models include: User, LandParcel, SoilHealthRecord, IoTSensor, Recommendation, RestorationActivity, DegradationAlert, UserModuleInteraction.

### Supabase Setup (Frontend Auth)

- Create a Supabase project and enable authentication.
- Update the `.env` with your project URL and anon key.
- The client uses Supabase for user auth and real-time features.

## Usage

1. Start both the backend and frontend servers.
2. Access the app at `http://localhost:5173`.
3. Register or log in via the landing page.
4. Use the dashboard to add land parcels, monitor soil health, view recommendations, and track restoration activities.
5. Upload images for AI analysis or connect IoT sensors for live data.
6. Export reports as needed.

### Key User Flows
- **Onboarding**: Sign up, add first land parcel via modal.
- **Monitoring**: View dashboard stats, drill into soil health or sensor data.
- **Analysis**: Upload images or request AI recommendations.
- **Alerts**: Receive and resolve degradation notifications.
- **Reporting**: Track impact and export data.

## API Endpoints

The backend exposes RESTful APIs under `/api/`:

- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Users**: `/api/users/profile`
- **Land Parcels**: `/api/land-parcels` (CRUD)
- **Soil Health**: `/api/soil-health/records`
- **Sensors**: `/api/sensors` (IoT data)
- **Recommendations**: `/api/recommendations/generate`
- **Restoration**: `/api/restoration/activities`
- **Alerts**: `/api/alerts`
- **Image Analysis**: `/api/image-analysis/upload`
- **Background Processing**: `/api/background-processing/tasks`

All endpoints require authentication except auth routes. Use Bearer token in headers.

## Testing

### Backend
Run tests:
```
cd server
pnpm test
```
Coverage reports are generated in `server/coverage/`.

### Frontend
Lint and typecheck:
```
cd client
pnpm lint
pnpm typecheck
```

## Deployment

- **Frontend**: Deploy to Vercel. Update `vercel.json` if needed. Set environment variables in Vercel dashboard.
- **Backend**: Deploy to platforms like Render, Heroku, or AWS. Ensure MongoDB and external API keys are configured.
- Update `CLIENT_URL` and CORS origins for production.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Please ensure code follows existing patterns, add tests, and update documentation.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details. (Add a LICENSE file if not present.)

## Contact

For questions or support, open an issue on GitHub or reach out via the project's maintainers.

---

*Built with ❤️ for sustainable land management.*
