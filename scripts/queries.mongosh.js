use('learnhub');

// ==========================================
// 2.1 OPÉRATIONS CRUD
// ==========================================

// 1. Insérer un nouvel utilisateur (étudiant)
console.log("1. Insert User");
db.users.insertOne({
  firstName: "Thomas",
  lastName: "Anderson",
  email: "neo@matrix.com",
  role: "student",
  profile: {
    bio: "Développeur Fullstack en devenir",
    avatar: "https://example.com/neo.jpg",
    city: "Lyon",
    country: "France"
  },
  skills: ["JavaScript", "React"],
  isActive: true,
  totalCoursesEnrolled: 0,
  createdAt: new Date(),
  lastLoginAt: new Date()
});

// 2. Insérer 3 nouveaux cours en une seule opération
console.log("2. Insert 3 Courses");
db.courses.insertMany([
  {
    title: "Express.js Avancé",
    description: "Créez des API robustes",
    instructorId: ObjectId("65e0d4c189c9a50012345678"),
    category: "Web",
    difficulty: "advanced",
    price: 39.99,
    tags: ["backend", "javascript", "nodejs"],
    metadata: { duration: 800, totalLessons: 10, language: "fr" },
    rating: { average: 0, count: 0 },
    isPublished: true,
    enrollmentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Rust pour Débutants",
    description: "Découvrez le langage Rust",
    category: "DevOps",
    difficulty: "beginner",
    price: 59.99,
    tags: ["rust", "system"],
    isPublished: false,
    createdAt: new Date()
  },
  {
    title: "GraphQL Masterclass",
    description: "Alternative à REST",
    category: "Web",
    difficulty: "intermediate",
    price: 45.00,
    tags: ["api", "graphql"],
    isPublished: true,
    createdAt: new Date()
  }
]);

// 3. Modifier la ville dans le profil d'un utilisateur
console.log("3. Update City");
db.users.updateOne(
  { email: "wafae.errai@email.com" },
  { $set: { "profile.city": "Casa" } }
);

// 4. Incrémenter le compteur d'inscriptions d'un cours
console.log("4. Increment Enrollment");
const courseToUpdate = db.courses.findOne();
if (courseToUpdate) {
  db.courses.updateOne(
    { _id: courseToUpdate._id },
    { $inc: { enrollmentCount: 1 } }
  );
}

// 5. Ajouter un skill à un utilisateur
console.log("5. Push Skill");
db.users.updateOne(
  { firstName: "Alice" },
  { $push: { skills: "TypeScript" } }
);

// 6. Retirer un tag d'un cours
console.log("6. Pull Tag");
db.courses.updateOne(
  { title: "MongoDB pour Débutants" },
  { $pull: { tags: "nosql" } }
);

// 7. Désactiver les utilisateurs inactifs depuis plus de 6 mois
console.log("7. Deactivate Inactive Users");
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

db.users.updateMany(
  { lastLoginAt: { $lt: sixMonthsAgo } },
  { $set: { isActive: false } }
);

// 8. Créer ou mettre à jour un profil utilisateur (upsert)
console.log("8. Upsert Profile");
db.users.updateOne(
  { email: "new.user@email.com" },
  {
    $set: {
      firstName: "New",
      lastName: "User",
      role: "student",
      createdAt: new Date()
    }
  },
  { upsert: true }
);

// 9. Supprimer une review spécifique
console.log("9. Delete Review");
const reviewToDelete = db.reviews.findOne();
if (reviewToDelete) {
  db.reviews.deleteOne({ _id: reviewToDelete._id });
}

// 10. Supprimer toutes les inscriptions annulées
console.log("10. Delete Cancelled Enrollments");
db.enrollments.deleteMany({ status: "cancelled" });

// ==========================================
// 2.2 REQUÊTES DE SÉLECTION (FILTRES)
// ==========================================

// 11. Cours dont le prix est entre 20€ et 80€
console.log("11. Find Courses Price Range [20, 80]");
const coursesPrice = db.courses.find({
  price: { $gte: 20, $lte: 80 }
}).toArray();
console.log(`Trouvé: ${coursesPrice.length} cours`);

// 12. Cours des catégories "Database" ou "Web"
console.log("12. Find Categories Database OR Web");
const coursesCat = db.courses.find({
  category: { $in: ["Database", "Web"] }
}).toArray();
console.log(`Trouvé: ${coursesCat.length} cours`);

// 13. Cours dont la difficulté n'est pas "advanced"
console.log("13. Find Difficulty NOT Advanced");
const coursesNotAdv = db.courses.find({
  difficulty: { $ne: "advanced" }
}).toArray();
console.log(`Trouvé: ${coursesNotAdv.length} cours`);

// 14. Utilisateurs actifs et étudiants
console.log("14. Find Active Students");
const activeStudents = db.users.find({
  isActive: true,
  role: "student"
}).toArray();
console.log(`Trouvé: ${activeStudents.length} étudiants actifs`);

// 15. Cours gratuits OU avec une note moyenne >= 4.5
console.log("15. Find Free OR High Rated Courses");
const goodOrFree = db.courses.find({
  $or: [
    { price: 0 },
    { "rating.average": { $gte: 4.5 } }
  ]
}).toArray();
console.log(`Trouvé: ${goodOrFree.length} cours`);

// 16. Reviews dont le champ updatedAt existe
console.log("16. Find Reviews with UpdatedAt");
const oneReview = db.reviews.findOne();
if (oneReview) {
  db.reviews.updateOne(
    { _id: oneReview._id },
    { $set: { updatedAt: new Date(), comment: "Avis mis à jour !" } }
  );
}
const reviewsUpdated = db.reviews.find({
  updatedAt: { $exists: true, $ne: null }
}).toArray();
console.log(`Trouvé: ${reviewsUpdated.length} avis mis à jour`);

// 17. Utilisateurs habitant à Paris
console.log("17. Find Users in Paris");
const parisians = db.users.find({
  "profile.city": "Paris"
}).toArray();
console.log(`Trouvé: ${parisians.length} parisiens`);

// 18. Cours publiés avec une note moyenne >= 4
console.log("18. Find Published AND High Rated");
const explicitAnd = db.courses.find({
  $and: [
    { isPublished: true },
    { "rating.average": { $gte: 4 } }
  ]
}).toArray();
console.log(`Trouvé: ${explicitAnd.length} cours`);

// 19. Inscriptions dont le statut n'est ni "cancelled" ni "paused"
console.log("19. Find Enrollments Not Cancelled NOR Paused");
const activeEnrollments = db.enrollments.find({
  status: { $nin: ["cancelled", "paused"] }
}).toArray();
console.log(`Trouvé: ${activeEnrollments.length} inscriptions valides`);

// 20. Afficher uniquement le titre et le prix des cours
console.log("20. Project Title and Price");
const projection1 = db.courses.find(
  {},
  { title: 1, price: 1, _id: 0 }
).limit(3).toArray();
console.log(projection1);

// 21. Tous les champs utilisateurs sauf le profil
console.log("21. Project All Except Profile");
const projection2 = db.users.find(
  {},
  { profile: 0 }
).limit(1).toArray();
console.log(projection2);

// 22. Les 5 cours les mieux notés
console.log("22. Top 5 Rated Courses");
const top5 = db.courses.find()
  .sort({ "rating.average": -1 })
  .limit(5)
  .toArray();
console.log("Top 1:", top5[0] ? top5[0].title : "Aucun");

// 23. Cours triés par prix croissant
console.log("23. Sort Courses by Price Ascending");
const cheapest = db.courses.find()
  .sort({ price: 1 })
  .limit(3)
  .toArray();
console.log("Moins cher:", cheapest[0] ? cheapest[0].price : "Aucun");

// 24. Page 2 des cours (10 résultats par page)
console.log("24. Page 2 of Courses");
const page2 = db.courses.find()
  .sort({ title: 1 })
  .skip(10)
  .limit(10)
  .toArray();
console.log(`Page 2 contient ${page2.length} cours`);

// 25. Nombre total de cours publiés
console.log("25. Count Published Courses");
const countPub = db.courses.countDocuments({ isPublished: true });
console.log(`Total publiés: ${countPub}`);

// ==========================================
// 2.3 LOGIQUE MÉTIER
// ==========================================

// 26. Inscription : vérifier, inscrire, puis mettre à jour les compteurs
console.log("26. Enrollment Logic");
const userIdEnroll = db.users.findOne({ role: "student" })._id;
const courseIdEnroll = db.courses.findOne({ isPublished: true })._id;

const alreadyEnrolled = db.enrollments.findOne({ userId: userIdEnroll, courseId: courseIdEnroll });

if (!alreadyEnrolled) {
  db.enrollments.insertOne({
    userId: userIdEnroll,
    courseId: courseIdEnroll,
    status: "active",
    progress: { completedLessons: [], percentage: 0, lastAccessedAt: new Date() },
    enrolledAt: new Date(),
    payment: { amount: 49.99, method: "card", paidAt: new Date() }
  });
  db.courses.updateOne({ _id: courseIdEnroll }, { $inc: { enrollmentCount: 1 } });
  db.users.updateOne({ _id: userIdEnroll }, { $inc: { totalCoursesEnrolled: 1 } });
  console.log("Inscription réalisée avec succès");
} else {
  console.log("Utilisateur déjà inscrit");
}

// 27. Catalogue filtré : cours Web, publiés, prix < 70, note >= 4
console.log("27. Complex Catalog Query");
const catalog = db.courses.find(
  {
    category: "Web",
    isPublished: true,
    price: { $lt: 70 },
    "rating.average": { $gte: 4 }
  },
  { title: 1, price: 1, "rating.average": 1 }
).sort({ enrollmentCount: -1 })
  .limit(10)
  .toArray();
console.log(`Catalogue Web Top: ${catalog.length} résultats`);

// 28. Marquer une leçon comme complétée et recalculer la progression
console.log("28. Progress Update");
const enrollToUpdate = db.enrollments.findOne({ status: "active" });
if (enrollToUpdate) {
  const fakeLessonId = new ObjectId();
  db.enrollments.updateOne(
    { _id: enrollToUpdate._id },
    {
      $push: { "progress.completedLessons": fakeLessonId },
      $set: { "progress.lastAccessedAt": new Date() }
    }
  );
  db.enrollments.updateOne(
    { _id: enrollToUpdate._id },
    { $set: { "progress.percentage": 50 } }
  );
  console.log("Progression mise à jour");
}

// 29. Suppression en cascade d'un cours
console.log("29. Cascade Delete");
const courseToDelete = db.courses.findOne();
if (courseToDelete) {
  const cId = courseToDelete._id;
  db.courses.deleteOne({ _id: cId });
  db.lessons.deleteMany({ courseId: cId });
  db.reviews.deleteMany({ courseId: cId });
  db.enrollments.updateMany({ courseId: cId }, { $set: { status: "cancelled" } });
  console.log(`Cours ${cId} supprimé en cascade`);
}

// 30. Dashboard utilisateur : infos, inscriptions actives, dernières reviews
console.log("30. User Dashboard");
const userDashId = db.users.findOne({ role: "student" })._id;

const userInfo = db.users.findOne({ _id: userDashId }, { profile: 0 });
const activeInscriptions = db.enrollments.find({ userId: userDashId, status: "active" }).toArray();
const lastReviews = db.reviews.find({ userId: userDashId }).sort({ createdAt: -1 }).limit(5).toArray();

console.log({
  user: userInfo ? userInfo.email : "N/A",
  enrollmentsCount: activeInscriptions.length,
  reviewsCount: lastReviews.length
});

