
use('learnhub');

db.users.drop();
db.courses.drop();
db.lessons.drop();
db.enrollments.drop();
db.reviews.drop();

console.log("Base de données nettoyée. Début de l'insertion");

// ==========================================
// 1. UTILISATEURS 
// ==========================================
const users = [];
const firstNames = ["wafae", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Hugo", "Ivy", "Jack", "Kevin", "Laura", "Mike", "Nina", "Oscar", "Paul", "Quentin", "Rachel", "Sam", "Tina"];
const lastNames = ["errai", "Dupont", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy", "Roux", "David", "Bertrand", "Morel", "Fournier"];
const cities = ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille"];
const skillsList = ["JavaScript", "Python", "MongoDB", "React", "Node.js", "SQL", "Docker", "AWS"];

for (let i = 0; i < 20; i++) {
  const role = i < 5 ? "instructor" : "student";
  const user = {
    _id: new ObjectId(),
    firstName: firstNames[i],
    lastName: lastNames[i],
    email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
    role: role,
    profile: {
      bio: role === "instructor" ? "Expert formateur avec 10 ans d'expérience." : "Étudiant passionné par la tech.",
      avatar: `https://i.pravatar.cc/150?u=${i}`,
      city: cities[i % cities.length],
      country: "France"
    },
    skills: [skillsList[i % skillsList.length], skillsList[(i + 1) % skillsList.length]],
    isActive: i % 10 !== 0, // 1 user sur 10 inactif
    totalCoursesEnrolled: role === "student" ? Math.floor(Math.random() * 5) : 0,
    createdAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 365))), // Date aléatoire dans l'année passée
    lastLoginAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))) // Date aléatoire dans le mois passé
  };
  users.push(user);
}

db.users.insertMany(users);
console.log(`${users.length} utilisateurs insérés.`);

const instructorIds = users.filter(u => u.role === "instructor").map(u => u._id);
const studentIds = users.filter(u => u.role === "student").map(u => u._id);


// ==========================================
// 2. COURS 
// ==========================================
const courses = [];
const categories = ["Database", "Web", "Mobile", "DevOps", "AI"];
const difficulties = ["beginner", "intermediate", "advanced"];
const courseTitles = [
  "MongoDB pour Débutants", "Maîtriser React", "Python Avancé", "Node.js API REST", 
  "Docker pour DevOps", "Machine Learning Intro", "SQL vs NoSQL", "Flutter Mobile Apps",
  "Sécurité Web", "AWS Cloud Basics", "Vue.js Masterclass", "Angular Architecture",
  "Git & GitHub Pro", "UX/UI Design Basics", "Typescript complet"
];

for (let i = 0; i < 15; i++) {
  const price = i % 3 === 0 ? 0 : parseFloat((Math.random() * 100).toFixed(2)); // Certains gratuits
  const course = {
    _id: new ObjectId(),
    title: courseTitles[i],
    description: `Apprenez tout sur ${courseTitles[i]} dans ce cours complet.`,
    instructorId: instructorIds[i % instructorIds.length],
    category: categories[i % categories.length],
    difficulty: difficulties[i % difficulties.length],
    price: price,
    tags: [categories[i % categories.length].toLowerCase(), "tech", "coding"],
    metadata: {
      duration: 600 + (i * 60), 
      totalLessons: 10 + Math.floor(Math.random() * 10),
      language: "fr"
    },
    rating: { 
      average: parseFloat((3 + Math.random() * 2).toFixed(1)), 
      count: Math.floor(Math.random() * 100) 
    },
    isPublished: true,
    enrollmentCount: 0, 
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-11-20")
  };
  courses.push(course);
}

db.courses.insertMany(courses);
console.log(`${courses.length} cours insérés.`);


// ==========================================
// 3. LEÇONS (Lessons) - Min 30
// ==========================================
const lessons = [];
courses.forEach(course => {
  for (let j = 1; j <= 3; j++) {
    lessons.push({
      _id: new ObjectId(),
      courseId: course._id,
      title: `${course.title} - Chapitre ${j}`,
      content: "Contenu de la leçon...",
      type: "video",
      order: j,
      duration: 30,
      resources: [
        { name: "Slides PDF", url: "https://example.com/slides.pdf" }
      ],
      isFree: j === 1, 
      createdAt: course.createdAt
    });
  }
});

db.lessons.insertMany(lessons);
console.log(`${lessons.length} leçons insérées.`);


// ==========================================
// 4. INSCRIPTIONS (Enrollments) - Min 25
// ==========================================
const enrollments = [];
const statuses = ["active", "completed", "paused", "cancelled"];

let enrollmentCount = 0;
studentIds.forEach(studentId => {
  const randomCourses = courses.sort(() => 0.5 - Math.random()).slice(0, 2);
  
  randomCourses.forEach(course => {
    const courseLessons = lessons.filter(l => l.courseId.equals(course._id));
    const completedLessonIds = courseLessons.slice(0, 1).map(l => l._id); // 1 leçon finie

    enrollments.push({
      _id: new ObjectId(),
      userId: studentId,
      courseId: course._id,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      progress: {
        completedLessons: completedLessonIds,
        percentage: Math.round((completedLessonIds.length / courseLessons.length) * 100) || 0,
        lastAccessedAt: new Date()
      },
      payment: {
        amount: course.price,
        method: "card",
        paidAt: new Date()
      },
      enrolledAt: new Date("2024-06-15"),
      completedAt: null
    });
    enrollmentCount++;
    
   
  });
});

db.enrollments.insertMany(enrollments);
console.log(`${enrollments.length} inscriptions insérées.`);


// ==========================================
// 5. AVIS (Reviews) - Min 20
// ==========================================
const reviews = [];
enrollments.slice(0, 22).forEach(enrollment => {
  reviews.push({
    _id: new ObjectId(),
    userId: enrollment.userId,
    courseId: enrollment.courseId,
    rating: Math.floor(Math.random() * 2) + 4, // 4 ou 5
    title: "Super cours !",
    comment: "J'ai beaucoup appris, merci au formateur.",
    isVerified: true,
    helpfulCount: Math.floor(Math.random() * 20),
    createdAt: new Date(),
    updatedAt: null
  });
});

db.reviews.insertMany(reviews);
console.log(`${reviews.length} avis insérés.`);

console.log("Initialisation terminée avec succès !");
