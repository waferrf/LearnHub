const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'learnhub';


app.use(express.json());
app.use(cors());

let db;

async function startServer() {
    try {
        const client = await MongoClient.connect(mongoUrl);
        db = client.db(dbName);
        console.log(` Connecté à MongoDB: ${dbName}`);
        
        app.listen(port, () => {
            console.log(` Serveur API lancé sur http://localhost:${port}`);
        });

    } catch (err) {
        console.error(" Erreur de connexion MongoDB:", err);
        process.exit(1); // Arrêter le processus en cas d'erreur critique
    }
}

startServer();

// ==========================================
// ROUTES DE BASE 
// ==========================================

// Route de test
app.get('/', (req, res) => {
    res.send({ message: "Bienvenue sur l'API LearnHub v1.0 " });
});

// ---------------------------------------------------------
// USERS
// ---------------------------------------------------------

// 1. GET /api/users - Lister tous les utilisateurs (avec filtre optionnel)
app.get('/api/users', async (req, res) => {
    try {
        const query = {};
        if (req.query.role) query.role = req.query.role;
        const users = await db.collection('users').find(query).limit(20).toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GET /api/users/:id - Récupérer un utilisateur (findOne)
app.get('/api/users/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "ID invalide" });
        
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
        if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. POST /api/users - Créer un utilisateur (insertOne)
app.post('/api/users', async (req, res) => {
    try {
        const newUser = req.body;
        if (!newUser.email || !newUser.firstName) return res.status(400).json({ error: "Email et Prénom requis" });
        
        newUser.createdAt = new Date();
        newUser.isActive = true;

        const result = await db.collection('users').insertOne(newUser);
        res.status(201).json({ _id: result.insertedId, ...newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. PATCH /api/users/:id - Modifier un utilisateur (updateOne)
app.patch('/api/users/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "ID invalide" });
        
        const updates = req.body;
        
        const updateDoc = { $set: updates };
        
        const hasOperators = Object.keys(updates).some(k => k.startsWith('$'));
        const finalUpdate = hasOperators ? updates : updateDoc;

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            finalUpdate
        );

        if (result.matchedCount === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
        res.json({ message: "Utilisateur mis à jour", modifiedCount: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---------------------------------------------------------
// COURSES (Filtres & Pagination)
// ---------------------------------------------------------

// 5. GET /api/courses - Recherche, filtres, tri et pagination
app.get('/api/courses', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;
        
        const filter = {};
        
        if (req.query.q) {
             const searchRegex = { $regex: req.query.q, $options: 'i' }; // 'i' = insensible à la casse
             filter.$or = [
                 { title: searchRegex },
                 { description: searchRegex }
             ];
        }

        if (category) filter.category = category;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        // Construction du tri
        let sortOptions = {}; 
        if (sort) {
            const field = sort.startsWith('-') ? sort.substring(1) : sort;
            const direction = sort.startsWith('-') ? -1 : 1;
            sortOptions[field] = direction;
        } else {
            sortOptions = { createdAt: -1 }; // Par défaut : les plus récents
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Exécution de la requête
        const courses = await db.collection('courses')
            .find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .toArray();

        // Compte total pour info pagination
        const total = await db.collection('courses').countDocuments(filter);

        res.json({
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            },
            data: courses
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. POST /api/courses/bulk - Insertion multiple (insertMany)
app.post('/api/courses/bulk', async (req, res) => {
    try {
        const coursesList = req.body;
        if (!Array.isArray(coursesList)) return res.status(400).json({ error: "Un tableau de cours est attendu" });

        const result = await db.collection('courses').insertMany(coursesList);
        res.status(201).json({ 
            message: `${result.insertedCount} cours ajoutés`, 
            insertedIds: result.insertedIds 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// PHASE 4 : LOGIQUE MÉTIER AVANCÉE
// ==========================================

//  SCÉNARIO 1 : Nouvelle Inscription (Vérifications + Inscription + Compteurs)
app.post('/api/enrollments', async (req, res) => {
    try {
        const { userId, courseId } = req.body;
        
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(courseId)) {
            return res.status(400).json({ error: "IDs invalides" });
        }

        const uId = new ObjectId(userId);
        const cId = new ObjectId(courseId);

        // 1. Vérifier que l'utilisateur existe
        const user = await db.collection('users').findOne({ _id: uId });
        if (!user) return res.status(404).json({ error: "Utilisateur inconnu" });

        // 2. Vérifier que le cours existe et est publié
        const course = await db.collection('courses').findOne({ _id: cId, isPublished: true });
        if (!course) return res.status(404).json({ error: "Cours introuvable ou non publié" });

        // 3. Vérifier doublon inscription
        const existingEnrollment = await db.collection('enrollments').findOne({
            userId: uId,
            courseId: cId,
            status: { $ne: "cancelled" }
        });

        if (existingEnrollment) {
            return res.status(409).json({ error: "Utilisateur déjà inscrit à ce cours" });
        }

        // 4. Créer l'inscription
        const newEnrollment = {
            userId: uId,
            courseId: cId,
            status: "active",
            progress: { completedLessons: [], percentage: 0, lastAccessedAt: new Date() },
            payment: { amount: course.price, method: "api", paidAt: new Date() },
            enrolledAt: new Date(),
            completedAt: null
        };
        
        const result = await db.collection('enrollments').insertOne(newEnrollment);

        // 5. Mettre à jour les compteurs (Courses + Users)
        await db.collection('courses').updateOne({ _id: cId }, { $inc: { enrollmentCount: 1 } });
        await db.collection('users').updateOne({ _id: uId }, { $inc: { totalCoursesEnrolled: 1 } });

        res.status(201).json({ 
            message: "Inscription réussie", 
            enrollmentId: result.insertedId 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

//  SCÉNARIO 2 : Dashboard Utilisateur (Agrégation de données)
app.get('/api/users/:id/dashboard', async (req, res) => {
    // Exercice : Récupérer User + Inscriptions + Avis en 3 appels
    try {
        const uId = new ObjectId(req.params.id);

        // Appel 1 : User Info (projection pour masquer données sensibles)
        const user = await db.collection('users').findOne(
            { _id: uId },
            { projection: { password: 0, __v: 0 } }
        );
        if (!user) return res.status(404).json({ error: "User not found" });

        // Appel 2 : Ses inscriptions actives
        const enrollments = await db.collection('enrollments')
            .find({ userId: uId, status: "active" })
            .limit(5)
            .toArray();

        // Appel 3 : Ses derniers avis
        const reviews = await db.collection('reviews')
            .find({ userId: uId })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();

        res.json({
            user: user,
            activeEnrollments: enrollments,
            recentReviews: reviews
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//  SCÉNARIO 3 : Suppression en Cascade (Cours -> Leçons -> Inscriptions -> Avis)
app.delete('/api/courses/:id', async (req, res) => {
    try {
        const cId = new ObjectId(req.params.id);

        // 1. Supprimer le document cours
        const deleteResult = await db.collection('courses').deleteOne({ _id: cId });
        
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: "Cours non trouvé" });
        }

        // 2. Cascade sur les collections liées
        const p1 = db.collection('lessons').deleteMany({ courseId: cId });
        const p2 = db.collection('reviews').deleteMany({ courseId: cId });
        
        // 3. Annuler les inscriptions (Soft delete)
        const p3 = db.collection('enrollments').updateMany(
            { courseId: cId },
            { $set: { status: "cancelled" } }
        );

        // Exécuter tout en parallèle
        const [resLessons, resReviews, resEnroll] = await Promise.all([p1, p2, p3]);

        res.json({
            message: "Cours supprimé avec succès (Cascade)",
            details: {
                lessonsDeleted: resLessons.deletedCount,
                reviewsDeleted: resReviews.deletedCount,
                enrollmentsCancelled: resEnroll.modifiedCount
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//  SCÉNARIO 4 : Laisser un avis + Vérification Inscription + Recalcul Moyenne
app.post('/api/reviews', async (req, res) => {
    try {
        const { userId, courseId, rating, title, comment } = req.body;

        if (!userId || !courseId || !rating) {
            return res.status(400).json({ error: "Champs obligatoires manquants" });
        }

        const uId = new ObjectId(userId);
        const cId = new ObjectId(courseId);
        const ratingNum = parseInt(rating);

        // 1. Vérifier si l'utilisateur est inscrit au cours
        const enrollment = await db.collection('enrollments').findOne({
            userId: uId,
            courseId: cId,
            status: { $in: ["active", "completed"] }
        });

        if (!enrollment) {
            return res.status(403).json({ error: "Vous devez être inscrit pour laisser un avis" });
        }

        // 2. Vérifier pas de doublon d'avis
        const existingReview = await db.collection('reviews').findOne({ 
            userId: uId, 
            courseId: cId 
        });

        if (existingReview) {
            return res.status(409).json({ error: "Vous avez déjà donné votre avis sur ce cours" });
        }

        // 3. Créer la review
        const newReview = {
            userId: uId,
            courseId: cId,
            rating: ratingNum,
            title: title || "",
            comment: comment || "",
            isVerified: true,
            helpfulCount: 0,
            createdAt: new Date(),
            updatedAt: null
        };

        await db.collection('reviews').insertOne(newReview);

        // 4. Recalculer la moyenne du cours
        const allReviews = await db.collection('reviews')
            .find({ courseId: cId })
            .toArray();
        
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAverage = allReviews.length > 0 ? (totalRating / allReviews.length) : 0;

        await db.collection('courses').updateOne(
            { _id: cId },
            { 
                $set: { 
                    "rating.average": parseFloat(newAverage.toFixed(1)),
                    "rating.count": allReviews.length
                } 
            }
        );

        res.status(201).json({ 
            message: "Avis ajouté avec succès", 
            newAverage: newAverage.toFixed(1) 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//  SCÉNARIO 5 : Progression (Terminer une leçon + Recalcul %)
app.patch('/api/enrollments/:id/progress', async (req, res) => {
    try {
        const eId = new ObjectId(req.params.id);
        const { lessonId } = req.body; // ID de la leçon terminée

        if (!lessonId) return res.status(400).json({ error: "lessonId requis" });
        const lId = new ObjectId(lessonId);

        // 1. Vérifier l'inscription
        const enrollment = await db.collection('enrollments').findOne({ _id: eId });
        if (!enrollment) return res.status(404).json({ error: "Inscription non trouvée" });

        const alreadyDone = enrollment.progress.completedLessons.some(id => id.toString() === lId.toString());
        if (alreadyDone) return res.status(200).json({ message: "Leçon déjà marquée comme lue" });

        // 2. Ajouter la leçon aux complétées ($push)
        const totalLessons = await db.collection('lessons').countDocuments({ courseId: enrollment.courseId });
        
        const currentCompleted = enrollment.progress.completedLessons.length + 1;
        const newPercentage = totalLessons > 0 ? Math.round((currentCompleted / totalLessons) * 100) : 0;

        const updates = {
            $push: { "progress.completedLessons": lId },
            $set: { 
                "progress.percentage": newPercentage,
                "progress.lastAccessedAt": new Date()
            }
        };

        
        if (newPercentage === 100) {
            updates.$set.status = "completed";
            updates.$set.completedAt = new Date();
        }

        // 3. Exécuter l'update
        await db.collection('enrollments').updateOne({ _id: eId }, updates);

        res.json({ 
            message: "Progression enregistrée", 
            percentage: newPercentage,
            status: newPercentage === 100 ? "completed" : enrollment.status
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// PHASE 5 : 
// ==========================================

// 1. Statistiques Globales
app.get('/api/stats', async (req, res) => {
    try {
        const [usersCount, coursesCount, enrollmentsCount] = await Promise.all([
            db.collection('users').countDocuments(),
            db.collection('courses').countDocuments(),
            db.collection('enrollments').countDocuments()
        ]);

        
        const popularCategory = await db.collection('courses').aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]).toArray();

        res.json({
            global: {
                totalUsers: usersCount,
                totalCourses: coursesCount,
                totalEnrollments: enrollmentsCount
            },
            highlights: {
                topCategory: popularCategory[0]?._id || "N/A"
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Export des données (JSON)
app.get('/api/export', async (req, res) => {
    try {
        
        const [users, courses, enrollments, reviews] = await Promise.all([
            db.collection('users').find().toArray(),
            db.collection('courses').find().toArray(),
            db.collection('enrollments').find().toArray(),
            db.collection('reviews').find().toArray()
        ]);

        const exportData = {
            metadata: {
                exportedAt: new Date(),
                version: "1.0"
            },
            data: { users, courses, enrollments, reviews }
        };

        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=learnhub_dump.json');
        res.send(JSON.stringify(exportData, null, 2));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

console.log("Configuration serveur chargée...");
