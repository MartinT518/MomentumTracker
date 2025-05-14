import { db } from "./db";
import { coaches, coaching_sessions } from "@shared/schema";

export async function seedCoaches() {
  try {
    // Check if coaches already exist
    const existingCoaches = await db.select().from(coaches);
    if (existingCoaches.length > 0) {
      console.log("Coaches already seeded. Skipping...");
      return;
    }
    
    // Seed sample coaches
    const coachesData = [
      {
        user_id: 1, // Admin user
        name: "Sarah Johnson",
        bio: "Elite marathon runner with 10+ years of coaching experience. Specializing in marathon training and endurance building for all levels. Completed 20+ marathons with a PR of 2:45.",
        specialty: "Marathon Training",
        experience_years: "10",
        certifications: "USATF Level 2, RRCA Certified Coach, Exercise Science Degree",
        profile_image: "https://i.imgur.com/JFHjdNh.jpg",
        hourly_rate: "75",
        available: true
      },
      {
        user_id: 1, // Admin user
        name: "Michael Chen",
        bio: "Former Olympic Trials qualifier specializing in 5K-10K training. I focus on building speed and efficiency for runners of all levels. My coaching philosophy emphasizes quality over quantity.",
        specialty: "Speed Development",
        experience_years: "8",
        certifications: "USATF Level 3, NASM-CPT, MS in Exercise Physiology",
        profile_image: "https://i.imgur.com/7wCgsaz.jpg",
        hourly_rate: "90",
        available: true
      },
      {
        user_id: 1, // Admin user
        name: "Alicia Rodriguez",
        bio: "Ultrarunner and trail specialist with over 15 years of experience. I've completed over 30 ultramarathons including Western States and UTMB. I help runners transition from road to trail and build trail-specific skills.",
        specialty: "Trail Running & Ultras",
        experience_years: "15",
        certifications: "RRCA Certified Coach, Wilderness First Responder, NASM-CPT",
        profile_image: "https://i.imgur.com/nPzwWMm.jpg",
        hourly_rate: "85",
        available: true
      },
      {
        user_id: 1, // Admin user
        name: "James Wilson",
        bio: "Sports medicine professional and running coach specializing in injury prevention and recovery. My background in physical therapy allows me to help runners overcome injuries and develop resilient running patterns.",
        specialty: "Injury Prevention",
        experience_years: "12",
        certifications: "DPT, CSCS, USATF Level 2",
        profile_image: "https://i.imgur.com/KGgxDCt.jpg",
        hourly_rate: "95",
        available: true
      }
    ];
    
    // Insert coaches
    await db.insert(coaches).values(coachesData);
    console.log("Coaches seeded successfully!");
    
    // Seed sample coaching sessions
    const sessionsData = [
      {
        coach_id: 1,
        athlete_id: 1, // The logged in test user
        session_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        duration_minutes: 45,
        type: "Plan Review",
        status: "scheduled",
        notes: "Initial consultation to review current training plan and goals."
      },
      {
        coach_id: 2,
        athlete_id: 1, // The logged in test user
        session_date: new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        duration_minutes: 60,
        type: "Video Analysis",
        status: "completed",
        notes: "Running form analysis and feedback.",
        recording_url: "https://example.com/recording123"
      }
    ];
    
    // Insert coaching sessions
    await db.insert(coaching_sessions).values(sessionsData);
    console.log("Coaching sessions seeded successfully!");
    
  } catch (error) {
    console.error("Error seeding coaches:", error);
  }
}