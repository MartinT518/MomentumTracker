import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { db } from '../../server/db';
import { users, onboarding_status } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Import your app setup
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { setupAuth } from '../../server/auth';

describe('User Registration Integration Test', () => {
  let app: Express;
  let server: any;
  let testUserId: number;

  beforeAll(async () => {
    // Set up Express app for testing
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Setup authentication and routes
    setupAuth(app);
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await db.delete(onboarding_status).where(eq(onboarding_status.user_id, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
    
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clean up any existing test user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, 'testuser')
    });
    
    if (existingUser) {
      await db.delete(onboarding_status).where(eq(onboarding_status.user_id, existingUser.id));
      await db.delete(users).where(eq(users.id, existingUser.id));
    }
  });

  it('should complete the full user registration flow', async () => {
    const testUser = {
      username: 'testuser',
      password: 'testpassword123'
    };

    // Step 1: Register new user
    const registerResponse = await request(app)
      .post('/api/register')
      .send(testUser)
      .expect(201);

    expect(registerResponse.body).toHaveProperty('id');
    expect(registerResponse.body.username).toBe(testUser.username);
    expect(registerResponse.body).not.toHaveProperty('password'); // Password should not be returned
    
    testUserId = registerResponse.body.id;

    // Step 2: Verify user exists in database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, testUserId)
    });

    expect(dbUser).toBeTruthy();
    expect(dbUser!.username).toBe(testUser.username);
    expect(dbUser!.password).not.toBe(testUser.password); // Should be hashed

    // Step 3: Verify onboarding status was created
    const onboardingStatus = await db.query.onboarding_status.findFirst({
      where: eq(onboarding_status.user_id, testUserId)
    });

    expect(onboardingStatus).toBeTruthy();
    expect(onboardingStatus!.completed).toBe(false);

    // Step 4: Test login with registered user
    const loginResponse = await request(app)
      .post('/api/login')
      .send(testUser)
      .expect(200);

    expect(loginResponse.body.id).toBe(testUserId);
    expect(loginResponse.body.username).toBe(testUser.username);

    // Step 5: Test authenticated endpoint access
    const agent = request.agent(app);
    await agent.post('/api/login').send(testUser);

    const userResponse = await agent
      .get('/api/user')
      .expect(200);

    expect(userResponse.body.id).toBe(testUserId);
    expect(userResponse.body.username).toBe(testUser.username);
  });

  it('should prevent duplicate user registration', async () => {
    const testUser = {
      username: 'duplicateuser',
      password: 'testpassword123'
    };

    // Register user first time
    const firstResponse = await request(app)
      .post('/api/register')
      .send(testUser)
      .expect(201);

    testUserId = firstResponse.body.id;

    // Try to register same username again
    await request(app)
      .post('/api/register')
      .send(testUser)
      .expect(400);

    // Verify only one user exists in database
    const dbUsers = await db.select()
      .from(users)
      .where(eq(users.username, testUser.username));

    expect(dbUsers).toHaveLength(1);
  });

  it('should handle login with incorrect credentials', async () => {
    const testUser = {
      username: 'logintest',
      password: 'correctpassword'
    };

    // Register user
    const registerResponse = await request(app)
      .post('/api/register')
      .send(testUser)
      .expect(201);

    testUserId = registerResponse.body.id;

    // Try login with wrong password
    await request(app)
      .post('/api/login')
      .send({
        username: testUser.username,
        password: 'wrongpassword'
      })
      .expect(401);

    // Try login with wrong username
    await request(app)
      .post('/api/login')
      .send({
        username: 'wrongusername',
        password: testUser.password
      })
      .expect(401);
  });

  it('should handle logout correctly', async () => {
    const testUser = {
      username: 'logouttest',
      password: 'testpassword123'
    };

    // Register and login
    const registerResponse = await request(app)
      .post('/api/register')
      .send(testUser)
      .expect(201);

    testUserId = registerResponse.body.id;

    const agent = request.agent(app);
    await agent.post('/api/login').send(testUser);

    // Verify authenticated access works
    await agent.get('/api/user').expect(200);

    // Logout
    await agent.post('/api/logout').expect(200);

    // Verify access is denied after logout
    await agent.get('/api/user').expect(401);
  });

  it('should validate required fields during registration', async () => {
    // Test missing username
    await request(app)
      .post('/api/register')
      .send({ password: 'testpassword123' })
      .expect(400);

    // Test missing password
    await request(app)
      .post('/api/register')
      .send({ username: 'testuser' })
      .expect(400);

    // Test empty fields
    await request(app)
      .post('/api/register')
      .send({ username: '', password: '' })
      .expect(400);
  });
});