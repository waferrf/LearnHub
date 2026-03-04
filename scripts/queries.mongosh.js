use('learnhub');

console.log("=== OPÉRATIONS CRUD ===");

// ---------------------------------------------------------
// INSERT 
// ---------------------------------------------------------

// 1. Insérer un nouvel utilisateur (étudiant) avec tous ses champs
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
    instructorId: ObjectId("65e0d4c189c9a50012345678"), // ID fictif pour l'exemple
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

// ---------------------------------------------------------
// UPDATE 
// ---------------------------------------------------------

// 3. Modifier la ville dans le profil d'un utilisateur (document imbriqué)
console.log("3. Update City");
db.users.updateOne(
  { email: "wafae.errai@email.com" }, // Filtre : Trouver wafae
  { $set: { "profile.city": "Casa" } } // Action : Changer sa ville via notation pointée
);

// 4. Incrémenter le compteur d'inscriptions d'un cours de 1
const courseToUpdate = db.courses.findOne();
console.log("4. Increment Enrollment");
if (courseToUpdate) {
  db.courses.updateOne(
    { _id: courseToUpdate._id },
    { $inc: { enrollmentCount: 1 } } // $inc augmente la valeur numérique
  );
}

// 5. Ajouter un nouveau skill au tableau de skills d'un utilisateur
console.log("5. Push Skill");
db.users.updateOne(
  { firstName: "Alice" },
  { $push: { skills: "TypeScript" } } // $push ajoute à la fin du tableau
);

// 6. Retirer un tag spécifique du tableau de tags d'un cours
console.log("6. Pull Tag");
db.courses.updateOne(
  { title: "MongoDB pour Débutants" },
  { $pull: { tags: "nosql" } } // $pull retire la valeur du tableau
);

// 7. Désactiver tous les utilisateurs qui ne se sont pas connectés depuis plus de 6 mois
console.log("7. Deactivate Inactive Users");
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

db.users.updateMany(
  { lastLoginAt: { $lt: sixMonthsAgo } }, // Filtre : connexion < il y a 6 mois
  { $set: { isActive: false } }
);

// 8. Créer ou mettre à jour le profil d'un utilisateur (upsert)
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

// ---------------------------------------------------------
// DELETE
// ---------------------------------------------------------

// 9. Supprimer une review spécifique par son identifiant
const reviewToDelete = db.reviews.findOne();
console.log("9. Delete Review");
if (reviewToDelete) {
  db.reviews.deleteOne({ _id: reviewToDelete._id });
}

// 10. Supprimer toutes les inscriptions ayant le statut "cancelled"
console.log("10. Delete Cancelled Enrollments");
db.enrollments.deleteMany({ status: "cancelled" });

console.log("=== Fin des opérations CRUD ===");

// ==========================================
// 2.2 REQUÊTES DE SÉLECTION (FILTRES)
// ==========================================
console.log("\n===  SÉLECTION & FILTRES ===");

// ---------------------------------------------------------
// FILTRES
// ---------------------------------------------------------

// 11. Trouver les cours dont le prix est compris entre 20€ et 80€
console.log("11. Find Courses Price Range [20, 80]");
const coursesPrice = db.courses.find({ 
    price: { $gte: 20, $lte: 80 } 
}).toArray();
console.log(`Trouvé: ${coursesPrice.length} cours`);

// 12. Trouver les cours appartenant aux catégories "Database" ou "Web"
console.log("12. Find Categories Database OR Web");
const coursesCat = db.courses.find({ 
    category: { $in: ["Database", "Web"] } 
}).toArray();
console.log(`Trouvé: ${coursesCat.length} cours`);

// 13. Trouver les cours dont la difficulté n'est PAS "advanced"
console.log("13. Find Difficulty NOT Advanced");
const coursesNotAdv = db.courses.find({ 
    difficulty: { $ne: "advanced" } 
}).toArray();
console.log(`Trouvé: ${coursesNotAdv.length} cours`);

// 14. Trouver les utilisateurs qui sont actifs ET étudiants
console.log("14. Find Active Students");
const activeStudents = db.users.find({ 
    isActive: true, 
    role: "student" 
}).toArray();
console.log(`Trouvé: ${activeStudents.length} étudiants actifs`);

// 15. Trouver les cours qui sont gratuits OU qui ont une note moyenne ≥ 4.5
console.log("15. Find Free OR High Rated Courses");
const goodOrFree = db.courses.find({
    $or: [
        { price: 0 },
        { "rating.average": { $gte: 4.5 } }
    ]
}).toArray();
console.log(`Trouvé: ${goodOrFree.length} cours`);

// 16. Trouver les reviews dont le champ updatedAt existe et n'est pas null
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

// 17. Trouver les utilisateurs qui habitent à Paris (champ dans un document imbriqué)
console.log("17. Find Users in Paris");
const parisians = db.users.find({
    "profile.city": "Paris"
}).toArray();
console.log(`Trouvé: ${parisians.length} parisiens`);

// 18. Trouver les cours publiés avec une note moyenne >= 4 
console.log("18. Find Published AND High Rated (Explicit AND)");
const explicitAnd = db.courses.find({
    $and: [
        { isPublished: true },
        { "rating.average": { $gte: 4 } }
    ]
}).toArray();
console.log(`Trouvé: ${explicitAnd.length} cours`);

// 19. Trouver les inscriptions dont le statut n'est ni "cancelled" ni "paused"
console.log("19. Find Enrollments Not Cancelled NOR Paused");
const activeEnrollments = db.enrollments.find({
    status: { $nin: ["cancelled", "paused"] }
}).toArray();
console.log(`Trouvé: ${activeEnrollments.length} inscriptions valides`);

// ---------------------------------------------------------
// PROJECTION (Choisir les champs à afficher)
// ---------------------------------------------------------

// 20. Afficher uniquement le titre et le prix des cours (sans le _id)
console.log("20. Project Title and Price");
const projection1 = db.courses.find(
    {}, 
    { title: 1, price: 1, _id: 0 }
).limit(3).toArray();
console.log(projection1);

// 21. Afficher tous les champs des utilisateurs SAUF le profil
console.log("21. Project All Except Profile");
const projection2 = db.users.find(
    {}, 
    { profile: 0 }
).limit(1).toArray();

// ---------------------------------------------------------
// TRI & PAGINATION
// ---------------------------------------------------------

// 22. Afficher les 5 cours les mieux notés
console.log("22. Top 5 Rated Courses");
const top5 = db.courses.find()
    .sort({ "rating.average": -1 }) 
    .limit(5)
    .toArray();
console.log("Top 1:", top5[0] ? top5[0].title : "Aucun");

// 23. Afficher tous les cours triés par prix croissant
console.log("23. Sort Courses by Price Ascending");
const cheapest = db.courses.find()
    .sort({ price: 1 }) 
    .limit(3)
    .toArray();
console.log("Moins cher:", cheapest[0] ? cheapest[0].price : "Aucun");

// 24. Afficher la page 2 des cours (10 résultats par page)
console.log("24. Page 2 of Courses");
const page2 = db.courses.find()
    .sort({ title: 1 })
    .skip(10) 
    .limit(10)
    .toArray();
console.log(`Page 2 contient ${page2.length} cours`);

// 25. Compter le nombre total de cours publiés
console.log("25. Count Published Courses");
const countPub = db.courses.countDocuments({ isPublished: true });
console.log(`Total publiés: ${countPub}`);

console.log("=== Fin de la Sélection ===");

// ==========================================
// 2.3 REQUÊTES MÉTIER (LOGIQUE MULTI-ÉTAPES)
// ==========================================
console.log("\n=== 2.3 LOGIQUE MÉTIER & TRANSACTIONS (Simulation) ===");

// 26. Inscription : Vérifier qu'un utilisateur n'est pas déjà inscrit, puis l'inscrire, puis update compteurs
console.log("26. Enrollment Logic (Simulation)");

const userIdEnroll = db.users.findOne({ role: "student" })._id;
const courseIdEnroll = db.courses.findOne({ isPublished: true })._id;


// Etape 2 : Vérif pas déjà inscrit
const alreadyEnrolled = db.enrollments.findOne({ userId: userIdEnroll, courseId: courseIdEnroll });

if (!alreadyEnrolled) {
    // Etape 3 : Création
    db.enrollments.insertOne({
        userId: userIdEnroll,
        courseId: courseIdEnroll,
        status: "active",
        progress: { completedLessons: [], percentage: 0, lastAccessedAt: new Date() },
        enrolledAt: new Date(),
        payment: { amount: 49.99, method: "card", paidAt: new Date() }
    });
    
    // Etape 4 : Update compteurs
    db.courses.updateOne({ _id: courseIdEnroll }, { $inc: { enrollmentCount: 1 } });
    db.users.updateOne({ _id: userIdEnroll }, { $inc: { totalCoursesEnrolled: 1 } });
    console.log("Inscription réalisée avec succès");
} else {
    console.log("Utilisateur déjà inscrit");
}

// 27. Catalogue complexe
console.log("27. Complex Catalog Query");
const catalog = db.courses.find(
    {
        category: "Web",
        isPublished: true,
        price: { $lt: 70 },
        "rating.average": { $gte: 4 }
    },
    { title: 1, price: 1, "rating.average": 1 } 
).sort({ enrollmentCount: -1 }) // Popularité
 .limit(10) 
 .toArray();
console.log(`Catalogue Web Top: ${catalog.length} résultats`);

// 28. Progression : Marquer leçon complétée + Recalcul %
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

// 29. Cascade Delete (Simulation)
console.log("29. Cascade Delete Logic");
const courseToDelete = db.courses.findOne();
if (courseToDelete) {
    const cId = courseToDelete._id;
    
    
    db.courses.deleteOne({ _id: cId });
    
    
    db.lessons.deleteMany({ courseId: cId });
    
    
    db.reviews.deleteMany({ courseId: cId });
    
    
    db.enrollments.updateMany(
        { courseId: cId },
        { $set: { status: "cancelled" } }
    );
    console.log(`Cours ${cId} supprimé en cascade.`);
}

// 30. Dashboard User
console.log("30. User Dashboard Aggregation");
const userDashId = db.users.findOne({ role: "student" })._id;

const userInfo = db.users.findOne({ _id: userDashId }, { profile: 0 });
const activeInscriptions = db.enrollments.find({ userId: userDashId, status: "active" }).toArray();
const lastReviews = db.reviews.find({ userId: userDashId }).sort({ createdAt: -1 }).limit(5).toArray();

console.log({
    user: userInfo ? userInfo.email : "N/A",
    enrollmentsCount: activeInscriptions.length,
    reviewsCount: lastReviews.length
});

