import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes(".")) {
    return false;
  }
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'aetherrun-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate required fields
      const { username, password } = req.body;
      
      if (!username || username.trim() === '') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const existingUser = await storage.getUserByUsername(username.trim());
      if (existingUser) {
        // Generate suggested usernames
        const baseUsername = username.trim();
        const suggestions = [];
        
        // Try adding numbers
        for (let i = 1; i <= 3; i++) {
          const suggestion = `${baseUsername}${i}`;
          const exists = await storage.getUserByUsername(suggestion);
          if (!exists) {
            suggestions.push(suggestion);
          }
        }
        
        // Try adding year
        const currentYear = new Date().getFullYear();
        const yearSuggestion = `${baseUsername}${currentYear}`;
        const yearExists = await storage.getUserByUsername(yearSuggestion);
        if (!yearExists && !suggestions.includes(yearSuggestion)) {
          suggestions.push(yearSuggestion);
        }
        
        // Try adding random numbers
        for (let i = 0; i < 2 && suggestions.length < 5; i++) {
          const randomNum = Math.floor(Math.random() * 999) + 100;
          const suggestion = `${baseUsername}${randomNum}`;
          const exists = await storage.getUserByUsername(suggestion);
          if (!exists && !suggestions.includes(suggestion)) {
            suggestions.push(suggestion);
          }
        }
        
        return res.status(400).json({ 
          message: "Username already exists",
          suggestions: suggestions.slice(0, 3) // Return top 3 suggestions
        });
      }

      const user = await storage.createUser({
        ...req.body,
        username: username.trim(),
        password: await hashPassword(password),
      });

      // Create initial onboarding status for new user
      try {
        await storage.createOnboardingStatus({
          user_id: user.id,
          completed: false,
          current_step: "welcome",
          steps_completed: []
        });
      } catch (error) {
        console.error("Error creating onboarding status:", error);
        // Don't fail registration if onboarding status creation fails
      }

      // Remove password from response for security
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
        experience_level: user.experience_level,
        bio: user.bio,
        profile_image: user.profile_image,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Handle other validation errors
      if (error.message && error.message.includes('username')) {
        return res.status(400).json({ message: "Invalid username format" });
      }
      
      return res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
