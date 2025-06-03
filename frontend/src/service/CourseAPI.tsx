import axios from 'axios';

interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    duration: number; // in hours
    category: 'stress' | 'anxiety' | 'sleep' | 'focus' | 'meditation';
    level: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    rating: number;
    enrollments: number;
    thumbnail: string;
    videoUrl?: string;
    isPremium: boolean;
    skills: string[];
}

class CourseAPI {
    private static readonly UDEMY_CLIENT_ID = 'your_udemy_client_id';
    private static readonly UDEMY_CLIENT_SECRET = 'your_udemy_client_secret';

    // 1. UDEMY COURSES
    static async fetchUdemyCourses(category: string): Promise<Course[]> {
        try {
            const response = await axios.get('https://www.udemy.com/api-2.0/courses/', {
                auth: {
                    username: this.UDEMY_CLIENT_ID,
                    password: this.UDEMY_CLIENT_SECRET
                },
                params: {
                    search: `${category} mindfulness wellness mental health`,
                    category: 'Health & Fitness',
                    language: 'en',
                    page_size: 20,
                    ordering: 'relevance'
                }
            });

            return response.data.results.map((course: any) => ({
                id: `udemy_${course.id}`,
                title: course.title,
                description: course.headline || course.description,
                instructor: course.visible_instructors[0]?.display_name || 'Unknown',
                duration: course.content_info_short || 0,
                category: this.categorizeContent(course.title + ' ' + course.headline),
                level: course.instructional_level || 'beginner',
                price: course.price_detail?.amount || 0,
                rating: course.rating || 0,
                enrollments: course.num_subscribers || 0,
                thumbnail: course.image_480x270 || course.image_750x422,
                isPremium: course.price_detail?.amount > 0,
                skills: course.what_you_will_learn_data?.items || []
            }));
        } catch (error) {
            console.error('Udemy API Error:', error);
            return [];
        }
    }

    // 2. YOUTUBE COURSES
    // static async fetchYouTubeCourses(category: string): Promise<Course[]> {
    //     // ...all code inside...
    // }

    // 3. CURATED WELLNESS COURSES
    static generateWellnessCourses(): Course[] {
        return [
            {
                id: 'wellness_stress_course_1',
                title: 'Complete Stress Management Masterclass',
                description: 'Learn evidence-based techniques to manage stress, build resilience, and improve your overall well-being.',
                instructor: 'Dr. Sarah Johnson, PhD Psychology',
                duration: 6,
                category: 'stress',
                level: 'beginner',
                price: 0,
                rating: 4.8,
                enrollments: 12500,
                thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
                isPremium: false,
                skills: ['Stress identification', 'Breathing techniques', 'Time management', 'Relaxation methods']
            },
            {
                id: 'wellness_meditation_course_1',
                title: 'Mindfulness Meditation: From Beginner to Advanced',
                description: 'Comprehensive meditation course covering various techniques from basic awareness to advanced practices.',
                instructor: 'Master Chen Wei',
                duration: 8,
                category: 'meditation',
                level: 'beginner',
                price: 49.99,
                rating: 4.9,
                enrollments: 8700,
                thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
                isPremium: true,
                skills: ['Mindful breathing', 'Body scanning', 'Walking meditation', 'Loving-kindness']
            },
            {
                id: 'wellness_anxiety_course_1',
                title: 'Anxiety Relief Through Cognitive Behavioral Techniques',
                description: 'Learn CBT strategies to understand and manage anxiety with practical exercises and real-world applications.',
                instructor: 'Dr. Lisa Thompson, Licensed Therapist',
                duration: 5,
                category: 'anxiety',
                level: 'intermediate',
                price: 29.99,
                rating: 4.7,
                enrollments: 6800,
                thumbnail: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88',
                isPremium: true,
                skills: ['Thought challenging', 'Exposure therapy', 'Relaxation techniques', 'Mindful awareness']
            },
            {
                id: 'wellness_sleep_course_1',
                title: 'Sleep Optimization: Science-Based Sleep Training',
                description: 'Improve your sleep quality with evidence-based techniques for better rest and recovery.',
                instructor: 'Dr. Michael Rodriguez, Sleep Specialist',
                duration: 4,
                category: 'sleep',
                level: 'beginner',
                price: 0,
                rating: 4.6,
                enrollments: 15200,
                thumbnail: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55',
                isPremium: false,
                skills: ['Sleep hygiene', 'Bedroom optimization', 'Relaxation routines', 'Sleep scheduling']
            },
            {
                id: 'wellness_focus_course_1',
                title: 'Deep Focus: Concentration Training for Modern Life',
                description: 'Develop laser-sharp focus and concentration skills to thrive in our distracted world.',
                instructor: 'Prof. David Kim, Cognitive Science',
                duration: 7,
                category: 'focus',
                level: 'intermediate',
                price: 39.99,
                rating: 4.8,
                enrollments: 9200,
                thumbnail: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2',
                isPremium: true,
                skills: ['Attention training', 'Distraction management', 'Flow states', 'Productivity systems']
            }
        ];
    }

    // 4. COMBINED API FETCH
    static async fetchAllCourses(categories: string[] = ['stress', 'anxiety', 'sleep', 'focus', 'meditation']): Promise<Course[]> {
        try {
            const allCourses: Course[] = [];

            // Add curated wellness courses
            allCourses.push(...this.generateWellnessCourses());

            // Fetch from external APIs for each category
            for (const category of categories) {
                try {
                    // Fetch Udemy courses (if you have API access)
                    // const udemyCourses = await this.fetchUdemyCourses(category);
                    // allCourses.push(...udemyCourses);

                    // YouTube API call removed
                } catch (error) {
                    console.error(`Error fetching ${category} courses:`, error);
                }
            }

            // Shuffle and return
            return allCourses.sort(() => Math.random() - 0.5);
        } catch (error) {
            console.error('Error fetching all courses:', error);
            return this.generateWellnessCourses(); // Fallback to curated content
        }
    }

    // Helper function to categorize content
    private static categorizeContent(content: string): 'stress' | 'anxiety' | 'sleep' | 'focus' | 'meditation' {
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('stress') || lowerContent.includes('pressure')) return 'stress';
        if (lowerContent.includes('anxiety') || lowerContent.includes('worry')) return 'anxiety';
        if (lowerContent.includes('sleep') || lowerContent.includes('insomnia')) return 'sleep';
        if (lowerContent.includes('focus') || lowerContent.includes('concentration')) return 'focus';
        if (lowerContent.includes('meditation') || lowerContent.includes('mindful')) return 'meditation';

        return 'meditation'; // Default
    }
}

export default CourseAPI;
export type { Course };