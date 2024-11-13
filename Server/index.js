// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const app = express();

// Middleware
app.use(cors());
app.use(
  cors({
    origin: "https://bliss-assignment.vercel.app",
  })
);
app.use(express.json());

// MongoDB connection with proper error handling
mongoose
  .connect(
    "mongodb+srv://gademanicharan12:bliss@cluster0.wonlp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Enhanced Models with proper validation
const courseSchema = new mongoose.Schema(
  {
    course_name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    professor: {
      type: String,
      trim: true,
      default: null,
    },
    start_date: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (v) {
          return v instanceof Date && !isNaN(v);
        },
        message: "Invalid start date",
      },
    },
    end_date: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (v) {
          return v instanceof Date && !isNaN(v) && v > this.start_date;
        },
        message: "End date must be after start date",
      },
    },
  },
  {
    timestamps: true,
  }
);

const assignmentSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
      validate: {
        validator: async function (v) {
          const course = await mongoose.model("Course").findById(v);
          return course !== null;
        },
        message: "Invalid course ID",
      },
    },
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
    },
    due_date: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: async function (v) {
          const course = await mongoose
            .model("Course")
            .findById(this.course_id);
          return v >= course.start_date && v <= course.end_date;
        },
        message: "Due date must be within course duration",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed"],
        message: "Status must be either pending or completed",
      },
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance
courseSchema.index({ course_name: 1 });
assignmentSchema.index({ course_id: 1, due_date: 1 });

const Course = mongoose.model("Course", courseSchema);
const Assignment = mongoose.model("Assignment", assignmentSchema);

// Validation middleware
const validateCourse = [
  body("course_name").notEmpty().trim().escape(),
  body("professor").optional().trim().escape(),
  body("start_date").isISO8601(),
  body("end_date").isISO8601(),
];

const validateAssignment = [
  body("title").notEmpty().trim().escape(),
  body("due_date").isISO8601(),
  body("status").isIn(["pending", "completed"]),
];

// Enhanced Routes with proper validation and error handling
// Course Routes
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find().sort({ course_name: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching courses",
      error: error.message,
    });
  }
});

app.post("/api/courses", validateCourse, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const course = new Course(req.body);
    await course.validate();
    const newCourse = await course.save();
    res.status(201).json(newCourse);
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    } else {
      res.status(500).json({
        message: "Error creating course",
        error: error.message,
      });
    }
  }
});

app.put("/api/courses/:id", validateCourse, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    } else {
      res.status(500).json({
        message: "Error updating course",
        error: error.message,
      });
    }
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const course = await Course.findById(req.params.id).session(session);
      if (!course) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Course not found" });
      }

      // Delete related assignments first
      await Assignment.deleteMany({ course_id: req.params.id }).session(
        session
      );
      await Course.findByIdAndDelete(req.params.id).session(session);

      await session.commitTransaction();
      res.json({
        message: "Course and related assignments deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({
      message: "Error deleting course",
      error: error.message,
    });
  }
});

// Assignment Routes with enhanced error handling and validation
app.get("/api/assignments", async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("course_id", "course_name")
      .sort({ due_date: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching assignments",
      error: error.message,
    });
  }
});

app.get("/api/assignments/course/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const assignments = await Assignment.find({
      course_id: req.params.courseId,
    }).sort({ due_date: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching course assignments",
      error: error.message,
    });
  }
});

app.post("/api/assignments", async (req, res) => {
  const assignment = new Assignment(req.body);
  try {
    const newAssignment = await assignment.save();
    res.status(201).json(newAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/assignments/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/assignments/:id", async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: "Assignment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
