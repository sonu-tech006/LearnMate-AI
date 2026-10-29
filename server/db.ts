import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.ts';

// -------------------------------------------------------------
// TypeScript Interfaces for the 4 MongoDB Collections
// -------------------------------------------------------------
export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface INote {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  aiSummary?: {
    summary: string;
    keyConcepts: string[];
    definitions?: { term: string; definition: string }[];
    revisionPoints: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface IQuiz {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  questions: IQuizQuestion[];
  score?: number;
  totalQuestions: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface IStudySession {
  _id: string;
  userId: string;
  subject: string;
  durationMinutes: number;
  taskTitle: string;
  completed: boolean;
  scheduledAt: Date;
  createdAt: Date;
}

// -------------------------------------------------------------
// Mongoose Schemas (Collection 1: users)
// -------------------------------------------------------------
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

// (Collection 2: notes)
const NoteSchema = new Schema<INote>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, index: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    aiSummary: {
      summary: { type: String },
      keyConcepts: [{ type: String }],
      definitions: [
        {
          term: { type: String },
          definition: { type: String },
        },
      ],
      revisionPoints: [{ type: String }],
    },
  },
  { timestamps: true, collection: 'notes' }
);
NoteSchema.index({ userId: 1, createdAt: -1 });
NoteSchema.index({ userId: 1, subject: 1 });

// (Collection 3: quizzes)
const QuizSchema = new Schema<IQuiz>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswerIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
      },
    ],
    score: { type: Number, default: null },
    totalQuestions: { type: Number, required: true },
    completedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'quizzes' }
);
QuizSchema.index({ userId: 1, createdAt: -1 });

// (Collection 4: studySessions)
const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: String, required: true, index: true },
    subject: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    taskTitle: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    scheduledAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'studySessions' }
);
StudySessionSchema.index({ userId: 1, scheduledAt: 1 });

// Mongoose Models
export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const NoteModel: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
export const QuizModel: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
export const StudySessionModel: Model<IStudySession> =
  mongoose.models.StudySession || mongoose.model<IStudySession>('StudySession', StudySessionSchema);

// -------------------------------------------------------------
// Database Connection State & Resilient Adapter
// -------------------------------------------------------------
let isMongoConnected = false;
let dbStatusMessage = 'Connecting...';

export function getDatabaseStatus() {
  return {
    isAtlas: isMongoConnected,
    status: isMongoConnected ? 'connected' : 'in-memory-fallback',
    message: dbStatusMessage,
  };
}

// In-Memory store fallback if MONGODB_URI is absent or unavailable
interface InMemoryStore {
  users: IUser[];
  notes: INote[];
  quizzes: IQuiz[];
  studySessions: IStudySession[];
}

const memoryStore: InMemoryStore = {
  users: [],
  notes: [],
  quizzes: [],
  studySessions: [],
};

// Seed default demo user and realistic learning content
export async function seedDemoDataIfEmpty() {
  const demoEmail = 'alex.learner@example.com';
  let demoUser = await db.findUserByEmail(demoEmail);

  if (!demoUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Learner2026!', salt);
    demoUser = await db.createUser({
      name: 'Alex Johnson',
      email: demoEmail,
      passwordHash,
    });

    const uId = demoUser._id.toString();

    // Seed realistic notes
    await db.createNote({
      userId: uId,
      title: 'Neural Networks & Deep Learning Fundamentals',
      subject: 'Computer Science',
      content: `Neural networks are computing systems inspired by the biological neural networks that constitute animal brains.
Key components:
1. Input Layer: Receives raw features from datasets.
2. Hidden Layers: Apply weighted transformations followed by non-linear activation functions (ReLU, GELU, Sigmoid).
3. Output Layer: Produces final probability distributions (Softmax) or continuous values.
Backpropagation computes the gradient of the loss function with respect to weights using the chain rule of calculus. Modern optimizers like Adam and AdamW adjust learning rates dynamically to improve convergence stability.`,
      tags: ['AI', 'DeepLearning', 'MachineLearning', 'Backprop'],
      aiSummary: {
        summary: 'Neural networks are interconnected layers of nodes that learn representations from data via backpropagation and gradient descent optimization.',
        keyConcepts: [
          'Activation Functions introduce non-linearity',
          'Backpropagation uses the chain rule to propagate error gradients',
          'Adam optimizer adjusts adaptive moment estimation',
        ],
        definitions: [
          { term: 'Gradient Descent', definition: 'An optimization algorithm used to minimize loss by iteratively moving in the direction of steepest descent.' },
          { term: 'ReLU', definition: 'Rectified Linear Unit activation function defined as f(x) = max(0, x).' }
        ],
        revisionPoints: [
          'Compare Sigmoid vs ReLU gradient saturation issues',
          'Understand how learning rate impacts overshooting vs slow convergence',
          'Review the mathematical chain rule formulation for 2-layer perceptrons'
        ]
      }
    });

    await db.createNote({
      userId: uId,
      title: 'Cellular Respiration and ATP Synthesis',
      subject: 'Biology',
      content: `Cellular respiration is the metabolic process cells use to convert biochemical energy from nutrients into adenosine triphosphate (ATP).
The four stages are:
1. Glycolysis: Occurs in the cytoplasm. Breaks glucose (6-carbon) into 2 pyruvate molecules (3-carbon). Net yield: 2 ATP + 2 NADH.
2. Pyruvate Oxidation: Pyruvate transitions into mitochondrial matrix forming Acetyl-CoA + CO2.
3. Krebs Cycle (Citric Acid Cycle): Completes oxidation of glucose carbons. Generates NADH, FADH2, and 2 ATP.
4. Oxidative Phosphorylation & Electron Transport Chain (ETC): Electrons from NADH/FADH2 flow through inner mitochondrial membrane complexes, pumping protons into the intermembrane space. ATP Synthase harnesses this electrochemical proton gradient via chemiosmosis to produce 28-32 ATP.`,
      tags: ['Biology', 'Biochemistry', 'Metabolism', 'ATP'],
      aiSummary: {
        summary: 'Cellular respiration synthesizes roughly 30-32 ATP molecules per glucose molecule across glycolysis, Krebs cycle, and mitochondrial oxidative phosphorylation.',
        keyConcepts: [
          'Chemiosmosis drives ATP Synthase rotation',
          'Oxygen acts as the terminal electron acceptor in the ETC',
          'Glycolysis is anaerobic while Krebs and ETC require oxygen'
        ],
        definitions: [
          { term: 'ATP Synthase', definition: 'A multi-part protein enzyme that synthesizes ATP from ADP and inorganic phosphate using a proton gradient.' },
          { term: 'Chemiosmosis', definition: 'The movement of ions across a semipermeable membrane down their electrochemical gradient.' }
        ],
        revisionPoints: [
          'Recall the location of each respiration stage (cytoplasm vs matrix vs cristae)',
          'Identify what happens when oxygen is absent (lactic acid or ethanol fermentation)',
          'Calculate total ATP yield per molecule of glucose'
        ]
      }
    });

    // Note 4: Organic Chemistry
    await db.createNote({
      userId: uId,
      title: 'Organic Chemistry: SN1 vs SN2 Nucleophilic Substitution Mechanisms',
      subject: 'Chemistry',
      content: `Nucleophilic substitution is a fundamental reaction class in organic chemistry where an electron-rich nucleophile displaces a leaving group on a carbon skeleton.
SN1 (Substitution Nucleophilic Unimolecular):
- Two-step mechanism involving a carbocation intermediate.
- Rate depends only on substrate: Rate = k[Substrate].
- Favored by tertiary carbons, protic solvents (water, alcohols), and weak nucleophiles.
- Results in racemization of stereocenters.
SN2 (Substitution Nucleophilic Biomolecular):
- Concerted one-step mechanism with backside attack.
- Rate depends on both: Rate = k[Substrate][Nucleophile].
- Favored by primary carbons, polar aprotic solvents (acetone, DMSO), and strong nucleophiles.
- Results in complete inversion of stereochemistry (Walden inversion).`,
      tags: ['Chemistry', 'OrganicChemistry', 'SN1', 'SN2', 'Mechanisms'],
      aiSummary: {
        summary: 'Nucleophilic substitution divides into unimolecular (SN1) through carbocation intermediates and bimolecular (SN2) via concerted backside attack.',
        keyConcepts: [
          'SN2 causes Walden inversion of configuration',
          'SN1 proceeds via planar carbocation yielding racemic mixtures',
          'Polar aprotic solvents accelerate SN2 by not solvating the nucleophile anion'
        ],
        definitions: [
          { term: 'Nucleophile', definition: 'A chemical species that donates an electron pair to an electrophile to form a chemical bond.' },
          { term: 'Walden Inversion', definition: 'The inversion of a chiral center in a molecule in a concerted chemical reaction.' }
        ],
        revisionPoints: [
          'Recognize substrate steric hindrance differences (methyl > 1° > 2° > 3° for SN2)',
          'Identify suitable solvents: DMSO/DMF for SN2, H2O/EtOH for SN1'
        ]
      }
    });

    // Note 5: Linear Algebra
    await db.createNote({
      userId: uId,
      title: 'Linear Algebra: Eigenvalues, Eigenvectors & Spectral Decomposition',
      subject: 'Mathematics',
      content: `In linear algebra, an eigenvector of a square matrix A is a non-zero vector v that changes only by a scalar factor λ when linear transformation A is applied: A v = λ v.
Properties and Applications:
1. Characteristic Equation: det(A - λ I) = 0 is solved to discover eigenvalues.
2. Geometric Multiplicity: Dimension of the eigenspace ker(A - λ I).
3. Diagonalization: A matrix is diagonalizable if and only if it has n linearly independent eigenvectors (A = P D P^-1).
Applications include Principal Component Analysis (PCA) in machine learning, Google PageRank algorithm, vibration analysis in structural engineering, and quantum state formulations in physics.`,
      tags: ['Mathematics', 'LinearAlgebra', 'Eigenvalues', 'PCA', 'DataScience'],
      aiSummary: {
        summary: 'Eigenvectors represent invariant directions of linear transformations while eigenvalues denote the scale factor of stretch or compression.',
        keyConcepts: [
          'det(A - λI) = 0 determines the spectrum',
          'Symmetric matrices possess real eigenvalues and orthogonal eigenvectors',
          'Eigendecomposition accelerates matrix powers in Markov chains'
        ],
        definitions: [
          { term: 'Eigenvector', definition: 'A vector whose direction remains unchanged after a linear transformation.' },
          { term: 'Diagonalization', definition: 'Process of factoring a matrix into canonical diagonal form.' }
        ],
        revisionPoints: [
          'Practice computing 2x2 and 3x3 characteristic polynomials',
          'Relate PCA variance maximization to the largest eigenvalues of the covariance matrix'
        ]
      }
    });

    // Note 6: Thermodynamics
    await db.createNote({
      userId: uId,
      title: 'Thermodynamics: Entropy, the Second Law & Carnot Efficiency',
      subject: 'Physics',
      content: `Thermodynamics describes heat transfer and mechanical work relationships.
First Law: ΔU = Q - W (Conservation of internal energy).
Second Law: The total entropy of an isolated system never decreases over time (ΔS_universe ≥ 0). Natural processes are thermodynamically irreversible.
Carnot Cycle:
- Consists of two reversible isothermal and two reversible adiabatic processes.
- Sets the theoretical maximum efficiency for any heat engine operating between hot reservoir T_H and cold reservoir T_C: η_Carnot = 1 - (T_C / T_H).
No real heat engine can achieve higher efficiency than a Carnot engine operating between the same temperature bounds.`,
      tags: ['Physics', 'Thermodynamics', 'Entropy', 'Carnot', 'Energy'],
      aiSummary: {
        summary: 'The Second Law mandates that isolated systems progress toward maximal entropy, bounding heat engine efficiency by the Carnot limit.',
        keyConcepts: [
          'Entropy is a state function measuring microscopic degeneracy',
          'Carnot efficiency depends solely on absolute temperatures in Kelvin',
          'Perpetual motion machines of the second kind violate ΔS ≥ 0'
        ],
        definitions: [
          { term: 'Entropy', definition: 'A thermodynamic quantity representing the unavailability of a system’s thermal energy for conversion into mechanical work.' },
          { term: 'Adiabatic Process', definition: 'A thermodynamic process in which no heat is transferred into or out of the working substance.' }
        ],
        revisionPoints: [
          'Remember temperatures must strictly be converted to Kelvin in η = 1 - Tc/Th',
          'Calculate entropy change for reversible heat absorption: ΔS = ∫ dQ_rev / T'
        ]
      }
    });

    // Note 7: Psychology
    await db.createNote({
      userId: uId,
      title: 'Cognitive Psychology: Working Memory, Spaced Repetition & Retrieval Practice',
      subject: 'Psychology',
      content: `Cognitive psychology investigates human information processing and memory consolidation.
Baddeley and Hitch Working Memory Model:
1. Central Executive: Controls attention and coordinates slave systems.
2. Phonological Loop: Holds verbal and auditory traces.
3. Visuospatial Sketchpad: Stores visual and spatial imagery.
4. Episodic Buffer: Integrates sensory modalities into coherent sequential episodes.
Retention Science:
- Ebbinghaus Forgetting Curve shows rapid decay within 48 hours without reinforcement.
- Spaced Repetition expands review intervals progressively (Leitner box system).
- The Testing Effect (Retrieval Practice): Active retrieval cements neural pathways vastly better than passive re-reading.`,
      tags: ['Psychology', 'CognitiveScience', 'Memory', 'SpacedRepetition', 'Learning'],
      aiSummary: {
        summary: 'Working memory processes active thoughts while spaced retrieval practice counters the Ebbinghaus forgetting curve for long-term synaptic retention.',
        keyConcepts: [
          'Active recall triggers synaptic consolidation through effortful retrieval',
          'Cognitive load theory advises minimizing extraneous cognitive burden',
          'Interleaving disparate topics improves classification and transfer skills'
        ],
        definitions: [
          { term: 'Retrieval Practice', definition: 'A study technique that relies on calling information to mind rather than passively reviewing notes.' },
          { term: 'Spaced Repetition', definition: 'An evidence-based learning technique where review sessions are spaced across increasing intervals.' }
        ],
        revisionPoints: [
          'Utilize flashcards and self-quizzing rather than passive highlighting',
          'Schedule reviews at 1 day, 3 days, 7 days, and 21 days for optimal retention'
        ]
      }
    });

    // Note 8: Modern History
    await db.createNote({
      userId: uId,
      title: 'The Industrial Revolution & Socioeconomic Shifts',
      subject: 'History',
      content: `The Industrial Revolution began in Great Britain during the mid-18th century and marked a fundamental shift from agrarian, handicraft economies to machine-driven industrial manufacturing.
Key catalysts:
- Abundant coal and iron ore deposits in northern England.
- Agricultural advancements freeing farm labor for urban factories.
- Inventions including James Watt’s improved steam engine and the spinning jenny.
Consequences:
- Rapid urbanization led to overcrowded cities and tenement housing.
- Rise of trade unionism and labor reform acts.
- Global expansion of trade networks and colonial resource extraction.`,
      tags: ['History', 'Economics', 'Urbanization', 'SteamEngine'],
      aiSummary: {
        summary: 'The shift from agrarian to mechanized industrial production spurred rapid urban migration, capital formation, and major labor legal reforms.',
        keyConcepts: [
          'Watt Steam Engine transformed factory automation and rail transport',
          'Enclosure movement shifted rural workers into growing industrial centers'
        ],
        definitions: [
          { term: 'Urbanization', definition: 'The process of population concentration in towns and cities due to industrial employment.' }
        ],
        revisionPoints: [
          'Trace the evolution from domestic system to mechanized factory system',
          'Examine the Factory Acts of the 19th century regulating child labor'
        ]
      }
    });

    // Seed multiple complete quizzes
    await db.createQuiz({
      userId: uId,
      title: 'Deep Learning & Neural Networks Quiz',
      subject: 'Computer Science',
      questions: [
        {
          question: 'What is the primary role of an activation function in a neural network?',
          options: [
            'To introduce non-linearity so the model can learn complex patterns',
            'To normalize the dataset input values to range 0-1',
            'To compute the loss gradient with respect to input features',
            'To increase the learning rate during backward passes'
          ],
          correctAnswerIndex: 0,
          explanation: 'Without non-linear activation functions, any multi-layer neural network collapses into a single linear transformation regardless of depth.'
        },
        {
          question: 'Which mathematical principle forms the basis of backpropagation?',
          options: [
            'Fourier Transform',
            'The Chain Rule of Calculus',
            'Bayes Theorem of Probability',
            'Euler’s Identity'
          ],
          correctAnswerIndex: 1,
          explanation: 'Backpropagation recursively calculates partial derivatives through network layers using the chain rule: dL/dw = dL/dy * dy/dz * dz/dw.'
        },
        {
          question: 'What is a key advantage of the Adam optimizer over basic SGD?',
          options: [
            'It guarantees reaching the absolute global minimum on all non-convex functions',
            'It eliminates the need for calculating gradient vectors',
            'It maintains adaptive learning rates for each parameter based on first and second moments',
            'It avoids calculating weights in hidden layers'
          ],
          correctAnswerIndex: 2,
          explanation: 'Adam combines the advantages of AdaGrad and RMSProp by storing exponentially decaying averages of past squared gradients and past gradients.'
        }
      ],
      score: 3,
      totalQuestions: 3,
      completedAt: new Date(Date.now() - 3600 * 1000 * 12)
    });

    await db.createQuiz({
      userId: uId,
      title: 'Cellular Respiration & Mitochondrial ATP Quiz',
      subject: 'Biology',
      questions: [
        {
          question: 'Which stage of cellular respiration produces the majority of ATP molecules?',
          options: [
            'Glycolysis in the cytosol',
            'Pyruvate oxidation',
            'The Citric Acid Cycle',
            'Oxidative Phosphorylation via the Electron Transport Chain'
          ],
          correctAnswerIndex: 3,
          explanation: 'Oxidative phosphorylation generates approximately 26-28 ATP of the net ~30-32 ATP total produced from one molecule of glucose.'
        },
        {
          question: 'What molecule acts as the terminal electron acceptor in aerobic respiration?',
          options: [
            'Molecular Oxygen (O2)',
            'Carbon Dioxide (CO2)',
            'NAD+',
            'Water (H2O)'
          ],
          correctAnswerIndex: 0,
          explanation: 'Oxygen captures electrons at Complex IV of the ETC and binds protons to yield water (H2O).'
        },
        {
          question: 'Where does glycolysis take place in eukaryotic cells?',
          options: [
            'Mitochondrial matrix',
            'Inner mitochondrial membrane',
            'Cytosol (Cytoplasm)',
            'Endoplasmic reticulum'
          ],
          correctAnswerIndex: 2,
          explanation: 'Glycolysis is an anaerobic pathway occurring entirely in the cytoplasm before pyruvate enters the mitochondria.'
        }
      ],
      score: 3,
      totalQuestions: 3,
      completedAt: new Date(Date.now() - 3600 * 1000 * 36)
    });

    await db.createQuiz({
      userId: uId,
      title: 'Organic Chemistry SN1 vs SN2 Quiz',
      subject: 'Chemistry',
      questions: [
        {
          question: 'Which reaction condition strongly favors an SN2 mechanism over an SN1 mechanism?',
          options: [
            'Tertiary alkyl halide substrate in polar protic solvent',
            'Primary alkyl halide substrate with a strong nucleophile in polar aprotic solvent',
            'Bulky nucleophile in boiling water',
            'Formation of a resonance-stabilized carbocation'
          ],
          correctAnswerIndex: 1,
          explanation: 'SN2 requires unhindered backside attack on primary carbons and is accelerated by polar aprotic solvents like acetone or DMSO.'
        },
        {
          question: 'What stereochemical consequence is observed during an SN2 reaction on a chiral carbon?',
          options: [
            'Complete racemization into a 50:50 enantiomeric mixture',
            'Retention of stereochemical configuration',
            'Complete inversion of stereochemical configuration (Walden inversion)',
            'Loss of optical activity through planar intermediate'
          ],
          correctAnswerIndex: 2,
          explanation: 'Because the nucleophile attacks opposite the leaving group, the spatial configuration inverts like an umbrella in high wind.'
        }
      ],
      score: 2,
      totalQuestions: 2,
      completedAt: new Date(Date.now() - 3600 * 1000 * 60)
    });

    // Seed multiple completed and scheduled study sessions
    const now = new Date();
    const dayMs = 86400000;

    // Past 5 days of study for streak
    await db.createStudySession({
      userId: uId,
      subject: 'Physics',
      durationMinutes: 40,
      taskTitle: 'Derive Carnot Engine Efficiency Formula (η = 1 - Tc/Th)',
      completed: true,
      scheduledAt: new Date(now.getTime() - dayMs * 4),
    });

    await db.createStudySession({
      userId: uId,
      subject: 'Chemistry',
      durationMinutes: 35,
      taskTitle: 'Map SN1 vs SN2 Solvents and Nucleophile Strengths',
      completed: true,
      scheduledAt: new Date(now.getTime() - dayMs * 3),
    });

    await db.createStudySession({
      userId: uId,
      subject: 'Mathematics',
      durationMinutes: 50,
      taskTitle: 'Solve Eigenvector Problems & Diagonalize 3x3 Matrices',
      completed: true,
      scheduledAt: new Date(now.getTime() - dayMs * 2),
    });

    await db.createStudySession({
      userId: uId,
      subject: 'Computer Science',
      durationMinutes: 45,
      taskTitle: 'Master Backpropagation Mathematics & Derivatives',
      completed: true,
      scheduledAt: new Date(now.getTime() - dayMs),
    });

    await db.createStudySession({
      userId: uId,
      subject: 'Biology',
      durationMinutes: 30,
      taskTitle: 'Diagram Mitochondria Electron Transport Chain & ATP Synthase',
      completed: true,
      scheduledAt: now,
    });

    // Upcoming revision tasks
    await db.createStudySession({
      userId: uId,
      subject: 'Psychology',
      durationMinutes: 45,
      taskTitle: 'Review Baddeley Working Memory Model & Episodic Buffer',
      completed: false,
      scheduledAt: new Date(now.getTime() + dayMs),
    });

    await db.createStudySession({
      userId: uId,
      subject: 'History',
      durationMinutes: 40,
      taskTitle: 'Outline Factory Acts and Labor Movement Timeline',
      completed: false,
      scheduledAt: new Date(now.getTime() + dayMs * 2),
    });

    await db.createStudySession({
      userId: uId,
      subject: 'Computer Science',
      durationMinutes: 50,
      taskTitle: 'Implement 2-Layer Neural Network from Scratch in Python',
      completed: false,
      scheduledAt: new Date(now.getTime() + dayMs * 3),
    });

    await db.createStudySession({
      userId: uId,
      subject: 'Chemistry',
      durationMinutes: 40,
      taskTitle: 'Practice Reaction Mechanism Synthesis Problems',
      completed: false,
      scheduledAt: new Date(now.getTime() + dayMs * 4),
    });
  }
}

// Initialize connection
export async function initDatabase() {
  const uri = (config.mongoUri || '').trim();
  const hasPlaceholders =
    uri.includes('<') ||
    uri.includes('>') ||
    uri.includes('username:password') ||
    uri.includes('MY_MONGODB_URI') ||
    uri === '';

  if (!hasPlaceholders) {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      isMongoConnected = true;
      dbStatusMessage = 'Connected to MongoDB Atlas cluster';
      console.log('✅ Connected to MongoDB Atlas successfully.');
    } catch (err: unknown) {
      await mongoose.disconnect().catch(() => {});
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`ℹ️ MongoDB Atlas notice (${msg}). Using in-memory database store.`);
      isMongoConnected = false;
      dbStatusMessage = `In-memory store active (${msg})`;
    }
  } else {
    isMongoConnected = false;
    dbStatusMessage = 'In-memory database store active (set valid MONGODB_URI in secrets for Atlas cloud)';
    console.log('ℹ️ Operating in high-performance in-memory database store mode.');
  }

  // Seed initial demo data for instant out-of-the-box user experience
  await seedDemoDataIfEmpty();
}

// -------------------------------------------------------------
// Unified Database Access Layer (db)
// Uses MongoDB Mongoose if connected, or the resilient in-memory store
// -------------------------------------------------------------
export const db = {
  // --- USERS ---
  async findUserByEmail(email: string): Promise<IUser | null> {
    if (isMongoConnected) {
      const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
      if (!user) return null;
      return { ...user, _id: user._id.toString() } as unknown as IUser;
    }
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  },

  async findUserById(id: string): Promise<IUser | null> {
    if (isMongoConnected) {
      const user = await UserModel.findById(id).lean();
      if (!user) return null;
      return { ...user, _id: user._id.toString() } as unknown as IUser;
    }
    const user = memoryStore.users.find((u) => u._id.toString() === id.toString());
    return user ? { ...user } : null;
  },

  async createUser(data: { name: string; email: string; passwordHash: string }): Promise<IUser> {
    if (isMongoConnected) {
      const user = await UserModel.create({
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
      });
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
      };
    }
    const newUser: IUser = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      createdAt: new Date(),
    };
    memoryStore.users.push(newUser);
    return { ...newUser };
  },

  // --- NOTES ---
  async getNotes(
    userId: string,
    filters?: { subject?: string; search?: string; page?: number; limit?: number }
  ): Promise<{ notes: INote[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    if (isMongoConnected) {
      const query: Record<string, unknown> = { userId };
      if (filters?.subject && filters.subject !== 'All') {
        query.subject = filters.subject;
      }
      if (filters?.search && filters.search.trim()) {
        const regex = new RegExp(filters.search.trim(), 'i');
        query.$or = [{ title: regex }, { content: regex }, { tags: regex }];
      }

      const total = await NoteModel.countDocuments(query);
      const docs = await NoteModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean();
      const notes = docs.map((doc) => ({ ...doc, _id: doc._id.toString() })) as unknown as INote[];
      return { notes, total, page, limit };
    }

    let list = memoryStore.notes.filter((n) => n.userId === userId);
    if (filters?.subject && filters.subject !== 'All') {
      list = list.filter((n) => n.subject.toLowerCase() === filters.subject!.toLowerCase());
    }
    if (filters?.search && filters.search.trim()) {
      const s = filters.search.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(s) ||
          n.content.toLowerCase().includes(s) ||
          n.tags.some((t) => t.toLowerCase().includes(s))
      );
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const total = list.length;
    const paginated = list.slice(skip, skip + limit);
    return { notes: paginated.map((n) => ({ ...n })), total, page, limit };
  },

  async getNoteById(noteId: string, userId: string): Promise<INote | null> {
    if (isMongoConnected) {
      const doc = await NoteModel.findOne({ _id: noteId, userId }).lean();
      if (!doc) return null;
      return { ...doc, _id: doc._id.toString() } as unknown as INote;
    }
    const note = memoryStore.notes.find((n) => n._id === noteId && n.userId === userId);
    return note ? { ...note } : null;
  },

  async createNote(data: {
    userId: string;
    title: string;
    subject: string;
    content: string;
    tags?: string[];
    aiSummary?: INote['aiSummary'];
  }): Promise<INote> {
    const now = new Date();
    if (isMongoConnected) {
      const doc = await NoteModel.create({
        ...data,
        tags: data.tags || [],
        createdAt: now,
        updatedAt: now,
      });
      return { ...doc.toObject(), _id: doc._id.toString() } as unknown as INote;
    }
    const newNote: INote = {
      _id: 'not_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: data.userId,
      title: data.title,
      subject: data.subject,
      content: data.content,
      tags: data.tags || [],
      aiSummary: data.aiSummary,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.notes.unshift(newNote);
    return { ...newNote };
  },

  async updateNote(
    noteId: string,
    userId: string,
    updates: Partial<Omit<INote, '_id' | 'userId' | 'createdAt'>>
  ): Promise<INote | null> {
    const now = new Date();
    if (isMongoConnected) {
      const doc = await NoteModel.findOneAndUpdate(
        { _id: noteId, userId },
        { ...updates, updatedAt: now },
        { new: true }
      ).lean();
      if (!doc) return null;
      return { ...doc, _id: doc._id.toString() } as unknown as INote;
    }
    const idx = memoryStore.notes.findIndex((n) => n._id === noteId && n.userId === userId);
    if (idx === -1) return null;
    memoryStore.notes[idx] = {
      ...memoryStore.notes[idx],
      ...updates,
      updatedAt: now,
    };
    return { ...memoryStore.notes[idx] };
  },

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    if (isMongoConnected) {
      const res = await NoteModel.deleteOne({ _id: noteId, userId });
      return (res.deletedCount || 0) > 0;
    }
    const idx = memoryStore.notes.findIndex((n) => n._id === noteId && n.userId === userId);
    if (idx === -1) return false;
    memoryStore.notes.splice(idx, 1);
    return true;
  },

  // --- QUIZZES ---
  async getQuizzes(userId: string): Promise<IQuiz[]> {
    if (isMongoConnected) {
      const docs = await QuizModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return docs.map((d) => ({ ...d, _id: d._id.toString() })) as unknown as IQuiz[];
    }
    return memoryStore.quizzes
      .filter((q) => q.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((q) => ({ ...q }));
  },

  async getQuizById(quizId: string, userId: string): Promise<IQuiz | null> {
    if (isMongoConnected) {
      const doc = await QuizModel.findOne({ _id: quizId, userId }).lean();
      if (!doc) return null;
      return { ...doc, _id: doc._id.toString() } as unknown as IQuiz;
    }
    const quiz = memoryStore.quizzes.find((q) => q._id === quizId && q.userId === userId);
    return quiz ? { ...quiz } : null;
  },

  async createQuiz(data: {
    userId: string;
    title: string;
    subject: string;
    questions: IQuizQuestion[];
    score?: number;
    totalQuestions: number;
    completedAt?: Date;
  }): Promise<IQuiz> {
    const now = new Date();
    if (isMongoConnected) {
      const doc = await QuizModel.create({
        ...data,
        createdAt: now,
      });
      return { ...doc.toObject(), _id: doc._id.toString() } as unknown as IQuiz;
    }
    const newQuiz: IQuiz = {
      _id: 'qiz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: data.userId,
      title: data.title,
      subject: data.subject,
      questions: data.questions,
      score: data.score,
      totalQuestions: data.totalQuestions,
      completedAt: data.completedAt,
      createdAt: now,
    };
    memoryStore.quizzes.unshift(newQuiz);
    return { ...newQuiz };
  },

  async submitQuiz(quizId: string, userId: string, score: number): Promise<IQuiz | null> {
    const completedAt = new Date();
    if (isMongoConnected) {
      const doc = await QuizModel.findOneAndUpdate(
        { _id: quizId, userId },
        { score, completedAt },
        { new: true }
      ).lean();
      if (!doc) return null;
      return { ...doc, _id: doc._id.toString() } as unknown as IQuiz;
    }
    const idx = memoryStore.quizzes.findIndex((q) => q._id === quizId && q.userId === userId);
    if (idx === -1) return null;
    memoryStore.quizzes[idx] = {
      ...memoryStore.quizzes[idx],
      score,
      completedAt,
    };
    return { ...memoryStore.quizzes[idx] };
  },

  // --- STUDY SESSIONS ---
  async getStudySessions(userId: string): Promise<IStudySession[]> {
    if (isMongoConnected) {
      const docs = await StudySessionModel.find({ userId }).sort({ scheduledAt: 1 }).lean();
      return docs.map((d) => ({ ...d, _id: d._id.toString() })) as unknown as IStudySession[];
    }
    return memoryStore.studySessions
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .map((s) => ({ ...s }));
  },

  async createStudySession(data: {
    userId: string;
    subject: string;
    durationMinutes: number;
    taskTitle: string;
    completed?: boolean;
    scheduledAt: Date;
  }): Promise<IStudySession> {
    const now = new Date();
    if (isMongoConnected) {
      const doc = await StudySessionModel.create({
        ...data,
        completed: data.completed ?? false,
        createdAt: now,
      });
      return { ...doc.toObject(), _id: doc._id.toString() } as unknown as IStudySession;
    }
    const newSession: IStudySession = {
      _id: 'ses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: data.userId,
      subject: data.subject,
      durationMinutes: data.durationMinutes,
      taskTitle: data.taskTitle,
      completed: data.completed ?? false,
      scheduledAt: data.scheduledAt,
      createdAt: now,
    };
    memoryStore.studySessions.push(newSession);
    return { ...newSession };
  },

  async updateStudySession(
    sessionId: string,
    userId: string,
    updates: Partial<Pick<IStudySession, 'completed' | 'durationMinutes' | 'taskTitle' | 'scheduledAt'>>
  ): Promise<IStudySession | null> {
    if (isMongoConnected) {
      const doc = await StudySessionModel.findOneAndUpdate(
        { _id: sessionId, userId },
        { ...updates },
        { new: true }
      ).lean();
      if (!doc) return null;
      return { ...doc, _id: doc._id.toString() } as unknown as IStudySession;
    }
    const idx = memoryStore.studySessions.findIndex((s) => s._id === sessionId && s.userId === userId);
    if (idx === -1) return null;
    memoryStore.studySessions[idx] = {
      ...memoryStore.studySessions[idx],
      ...updates,
    };
    return { ...memoryStore.studySessions[idx] };
  },

  async deleteStudySession(sessionId: string, userId: string): Promise<boolean> {
    if (isMongoConnected) {
      const res = await StudySessionModel.deleteOne({ _id: sessionId, userId });
      return (res.deletedCount || 0) > 0;
    }
    const idx = memoryStore.studySessions.findIndex((s) => s._id === sessionId && s.userId === userId);
    if (idx === -1) return false;
    memoryStore.studySessions.splice(idx, 1);
    return true;
  },

  // --- ANALYTICS OVERVIEW ---
  async getAnalyticsOverview(userId: string) {
    const sessions = await this.getStudySessions(userId);
    const quizzes = await this.getQuizzes(userId);
    const notesResult = await this.getNotes(userId);

    const completedSessions = sessions.filter((s) => s.completed);
    const totalStudyMinutes = completedSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

    // Calculate streak
    const completedDates = new Set(
      completedSessions.map((s) => new Date(s.scheduledAt).toISOString().split('T')[0])
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      if (completedDates.has(str)) {
        streak++;
      } else if (i === 0) {
        // If haven't completed today yet, check yesterday before breaking
        continue;
      } else {
        break;
      }
    }
    if (streak === 0 && completedSessions.length > 0) {
      streak = 1; // Friendly floor for any active learner
    }

    // Weekly activity (last 7 days)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity: { day: string; date: string; minutes: number; tasksCompleted: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const daySessions = completedSessions.filter(
        (s) => new Date(s.scheduledAt).toISOString().split('T')[0] === dateStr
      );
      const minutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      weeklyActivity.push({
        day: dayName,
        date: dateStr,
        minutes,
        tasksCompleted: daySessions.length,
      });
    }

    // Subject breakdown
    const subjectMap: Record<string, { totalTime: number; quizScores: number[]; notesCount: number }> = {};
    for (const note of notesResult.notes) {
      const sub = note.subject || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = { totalTime: 0, quizScores: [], notesCount: 0 };
      subjectMap[sub].notesCount++;
    }
    for (const s of completedSessions) {
      const sub = s.subject || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = { totalTime: 0, quizScores: [], notesCount: 0 };
      subjectMap[sub].totalTime += s.durationMinutes;
    }
    for (const q of quizzes) {
      if (q.score !== null && q.score !== undefined && q.totalQuestions > 0) {
        const sub = q.subject || 'General';
        if (!subjectMap[sub]) subjectMap[sub] = { totalTime: 0, quizScores: [], notesCount: 0 };
        subjectMap[sub].quizScores.push(Math.round((q.score / q.totalQuestions) * 100));
      }
    }

    const subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => {
      const avgScore =
        data.quizScores.length > 0
          ? Math.round(data.quizScores.reduce((a, b) => a + b, 0) / data.quizScores.length)
          : 0;
      return {
        subject,
        studyMinutes: data.totalTime,
        averageQuizScore: avgScore,
        notesCount: data.notesCount,
        quizzesTaken: data.quizScores.length,
      };
    });

    // Quiz statistics
    const completedQuizzes = quizzes.filter((q) => q.score !== null && q.score !== undefined);
    const avgQuizScore =
      completedQuizzes.length > 0
        ? Math.round(
            completedQuizzes.reduce((acc, q) => acc + ((q.score || 0) / q.totalQuestions) * 100, 0) /
              completedQuizzes.length
          )
        : 0;

    // Today's goal calculation (e.g. 60 min target)
    const todayStr = today.toISOString().split('T')[0];
    const todaySessions = completedSessions.filter(
      (s) => new Date(s.scheduledAt).toISOString().split('T')[0] === todayStr
    );
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const dailyTargetMinutes = 45;
    const todayGoalCompletion = Math.min(100, Math.round((todayMinutes / dailyTargetMinutes) * 100));

    return {
      streakDays: streak,
      totalStudyMinutes,
      todayMinutes,
      dailyTargetMinutes,
      todayGoalCompletion,
      totalNotes: notesResult.total,
      totalQuizzesTaken: completedQuizzes.length,
      averageQuizScore: avgQuizScore,
      weeklyActivity,
      subjectPerformance,
      upcomingTasksCount: sessions.filter((s) => !s.completed).length,
    };
  },
};
