import { test, expect } from '@playwright/test';

test.describe('AetherRun User Journey E2E Tests', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'testpassword123'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('Complete user registration and onboarding flow', async ({ page }) => {
    // Step 1: Navigate to registration
    await page.click('text=Get Started');
    
    // Wait for auth modal to appear
    await page.waitForSelector('[data-testid="auth-modal"]', { timeout: 5000 });
    
    // Step 2: Register new user
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful registration and redirect to onboarding
    await page.waitForURL('/onboarding', { timeout: 10000 });
    
    // Step 3: Complete Fitness Goals step
    await expect(page.locator('h2')).toContainText('Fitness Goals');
    
    // Select primary goal
    await page.click('input[value="improve_fitness"]');
    
    // Fill in race details
    await page.click('input[name="has_target_race"]');
    await page.selectOption('select[name="goal_event_type"]', '10k');
    await page.fill('input[name="goal_distance"]', '10');
    await page.fill('input[name="goal_date"]', '2024-12-31');
    
    // Continue to next step
    await page.click('button:has-text("Next")');
    
    // Step 4: Complete Experience step
    await expect(page.locator('h2')).toContainText('Experience Level');
    
    // Select experience level
    await page.click('input[value="intermediate"]');
    
    // Fill in running experience
    await page.fill('input[name="years_running"]', '2');
    await page.fill('input[name="weekly_activity_days"]', '4');
    await page.fill('input[name="weekly_running_days"]', '3');
    await page.fill('input[name="typical_run_distance"]', '5');
    await page.fill('input[name="longest_run_last_month"]', '12');
    
    // Select injury history
    await page.click('text=None');
    
    await page.click('button:has-text("Next")');
    
    // Step 5: Complete Training Preferences step
    await expect(page.locator('h2')).toContainText('Training Preferences');
    
    // Select preferred workout types
    await page.click('text=Easy Runs');
    await page.click('text=Long Runs');
    await page.click('text=Tempo Runs');
    
    // Select cross-training activities
    await page.click('text=Strength Training');
    await page.click('text=Yoga');
    
    await page.click('button:has-text("Next")');
    
    // Step 6: Review Summary
    await expect(page.locator('h2')).toContainText('Summary');
    
    // Verify data is displayed in summary
    await expect(page.locator('text=Intermediate')).toBeVisible();
    await expect(page.locator('text=10k')).toBeVisible();
    
    // Complete onboarding
    await page.click('button:has-text("Complete Setup")');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('User login and navigation flow', async ({ page }) => {
    // First register a user
    await page.click('text=Get Started');
    await page.waitForSelector('[data-testid="auth-modal"]');
    
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Complete quick onboarding
    await page.waitForURL('/onboarding');
    await page.click('input[value="improve_fitness"]');
    await page.click('button:has-text("Next")');
    
    await page.click('input[value="beginner"]');
    await page.fill('input[name="years_running"]', '0');
    await page.fill('input[name="weekly_activity_days"]', '3');
    await page.fill('input[name="weekly_running_days"]', '2');
    await page.fill('input[name="typical_run_distance"]', '3');
    await page.fill('input[name="longest_run_last_month"]', '5');
    await page.click('text=None');
    await page.click('button:has-text("Next")');
    
    await page.click('text=Easy Runs');
    await page.click('button:has-text("Next")');
    
    await page.click('button:has-text("Complete Setup")');
    await page.waitForURL('/dashboard');
    
    // Now test navigation
    // Test Activities page
    await page.click('a[href="/activities"]');
    await page.waitForURL('/activities');
    await expect(page.locator('h1')).toContainText('Activities');
    
    // Test Training Plans page
    await page.click('a[href="/training-plan"]');
    await page.waitForURL('/training-plan');
    await expect(page.locator('h1')).toContainText('Training Plan');
    
    // Test Health Metrics page
    await page.click('a[href="/health-metrics"]');
    await page.waitForURL('/health-metrics');
    await expect(page.locator('h1')).toContainText('Health Metrics');
    
    // Test Settings page
    await page.click('a[href="/settings"]');
    await page.waitForURL('/settings');
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('Health metrics data entry flow', async ({ page }) => {
    // Login first
    await page.click('text=Get Started');
    await page.waitForSelector('[data-testid="auth-modal"]');
    
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Skip onboarding quickly
    await page.waitForURL('/onboarding');
    await page.goto('/dashboard'); // Direct navigation to skip onboarding
    
    // Navigate to health metrics
    await page.click('a[href="/health-metrics"]');
    await page.waitForURL('/health-metrics');
    
    // Add new health metrics
    await page.click('button:has-text("Add Entry")');
    
    // Fill in health metrics form
    await page.fill('input[name="hrv_score"]', '45');
    await page.fill('input[name="resting_heart_rate"]', '65');
    await page.fill('input[name="sleep_quality"]', '8');
    await page.fill('input[name="sleep_duration"]', '480'); // 8 hours in minutes
    await page.fill('input[name="energy_level"]', '7');
    await page.fill('input[name="stress_level"]', '3');
    await page.fill('textarea[name="notes"]', 'Feeling good today, well rested');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify entry was added
    await expect(page.locator('text=HRV: 45')).toBeVisible();
    await expect(page.locator('text=Energy: 7')).toBeVisible();
  });

  test('Training plan generation flow', async ({ page }) => {
    // Login and complete onboarding
    await page.click('text=Get Started');
    await page.waitForSelector('[data-testid="auth-modal"]');
    
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/onboarding');
    
    // Complete onboarding with race goal
    await page.click('input[value="race_training"]');
    await page.click('input[name="has_target_race"]');
    await page.selectOption('select[name="goal_event_type"]', '5k');
    await page.fill('input[name="goal_distance"]', '5');
    await page.fill('input[name="goal_date"]', '2024-06-15');
    await page.click('button:has-text("Next")');
    
    await page.click('input[value="intermediate"]');
    await page.fill('input[name="years_running"]', '2');
    await page.fill('input[name="weekly_activity_days"]', '5');
    await page.fill('input[name="weekly_running_days"]', '4');
    await page.fill('input[name="typical_run_distance"]', '6');
    await page.fill('input[name="longest_run_last_month"]', '15');
    await page.click('text=None');
    await page.click('button:has-text("Next")');
    
    await page.click('text=Easy Runs');
    await page.click('text=Tempo Runs');
    await page.click('text=Interval Training');
    await page.click('button:has-text("Next")');
    
    await page.click('button:has-text("Complete Setup")');
    await page.waitForURL('/dashboard');
    
    // Navigate to training plan
    await page.click('a[href="/training-plan"]');
    await page.waitForURL('/training-plan');
    
    // Generate new training plan
    await page.click('button:has-text("Generate New Plan")');
    
    // Wait for AI generation confirmation dialog
    await page.waitForSelector('text=Generate New Training Plan?');
    await page.click('button:has-text("Generate Plan")');
    
    // Wait for plan to be generated (this might take a moment)
    await page.waitForSelector('text=Week 1', { timeout: 15000 });
    
    // Verify training plan elements are present
    await expect(page.locator('text=Easy Run')).toBeVisible();
    await expect(page.locator('text=Rest Day')).toBeVisible();
  });

  test('Settings and profile management', async ({ page }) => {
    // Login
    await page.click('text=Get Started');
    await page.waitForSelector('[data-testid="auth-modal"]');
    
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/onboarding');
    await page.goto('/settings'); // Skip onboarding
    
    // Test profile settings
    await page.click('text=Profile');
    
    // Update profile information
    await page.fill('input[name="email"]', 'test@example.com');
    await page.selectOption('select[name="timezone"]', 'America/New_York');
    
    // Save profile changes
    await page.click('button:has-text("Save Changes")');
    
    // Verify success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    
    // Test training preferences
    await page.click('text=Training Preferences');
    
    // Verify saved onboarding data is displayed
    await expect(page.locator('select[name="currentLevel"]')).toBeVisible();
    
    // Test logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/');
    
    // Verify we're back to landing page
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('Error handling and validation', async ({ page }) => {
    // Test invalid login
    await page.click('text=Get Started');
    await page.waitForSelector('[data-testid="auth-modal"]');
    
    // Switch to login tab
    await page.click('text=Login');
    
    // Try invalid credentials
    await page.fill('input[name="username"]', 'nonexistent');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Test registration validation
    await page.click('text=Register');
    
    // Try empty form
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Username is required')).toBeVisible();
    
    // Try weak password
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least')).toBeVisible();
  });
});