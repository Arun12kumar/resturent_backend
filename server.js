require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const startServer = async () => {
  try {
    // 🧠 Wait until DB connection is established
    await connectDB();

    const app = express();

    // Passport config
    require('./config/passport')(passport);

    // Security headers
    app.use(helmet());

    // CORS
    app.use(cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    }));

    // Body parsers
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Sanitize MongoDB queries
    app.use(mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.log(`Sanitized ${key} on ${req.url}`);
      },
      allow: ['query'], // avoid crashing on read-only req.query
    }));

    // Prevent HTTP parameter pollution
    app.use(hpp());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    });
    app.use(limiter);

    // Session setup
    app.use(session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    }));

    // Passport init
    app.use(passport.initialize());
    app.use(passport.session());

    // Routes
    const authRoutes = require('./routes/authRoutes');
    const menuRoutes = require('./routes/menuRoutes');
    app.use('/api/auth', authRoutes);
    app.use('/api/menu', menuRoutes);

    // Error handler
    const errorHandler = require('./middlewares/errorMiddleware');
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  }
};

startServer();
